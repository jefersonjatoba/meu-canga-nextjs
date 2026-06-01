// GET /api/fatura/[contaId]?ciclo=YYYY-MM-DD
//   ciclo = closing date of the desired billing cycle (optional, defaults to current cycle)

import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { todayBR } from '@/lib/dates'
import {
  getCurrentCycle,
  getCycleByFechamento,
  prevFechamento,
  nextFechamento,
} from '@/lib/billing-cycle'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contaId: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { contaId } = await params

    const conta = await prisma.conta.findFirst({
      where: { id: contaId, userId: user.id, tipo: 'credit' },
      select: {
        id: true,
        nome: true,
        cor: true,
        saldoCentavos: true,
        limiteCentavos: true,
        diaFechamento: true,
        diaVencimento: true,
      },
    })

    if (!conta) return errorResponse('Cartão não encontrado', 404)
    if (!conta.diaFechamento || !conta.diaVencimento) {
      return errorResponse('Cartão sem datas de fechamento/vencimento configuradas', 422)
    }

    const today = todayBR()
    const cicloParam = request.nextUrl.searchParams.get('ciclo')

    const cycle = cicloParam
      ? getCycleByFechamento(cicloParam, conta.diaFechamento, conta.diaVencimento, today)
      : getCurrentCycle(conta.diaFechamento, conta.diaVencimento, today)

    // Filter by competenciaAt = vencimento month (YYYY-MM).
    // The card engine sets Lancamento.competenciaAt = dueDate.month = cycle.vencimento.month.
    // This matches FaturaCartao.competencia exactly for all diaFechamento/diaVencimento configs.
    // Using date-range on Lancamento.data was unreliable: Lancamento.data = dataVencimento,
    // which falls outside [abertura, fechamento] regardless of diaVencimento setting.
    const cycleCompetencia = cycle.vencimento.slice(0, 7)
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        userId: user.id,
        contaId,
        status: 'confirmada',
        deletadoEm: null,
        competenciaAt: cycleCompetencia,
      },
      orderBy: { data: 'desc' },
      select: {
        id: true,
        descricao: true,
        tipo: true,
        categoria: true,
        valorCentavos: true,
        data: true,
        status: true,
      },
    })

    // Only expenses count toward fatura; income entries are credits (estornos, cashback)
    const despesas  = lancamentos.filter(l => l.tipo === 'expense')
    const creditos  = lancamentos.filter(l => l.tipo === 'income')

    const totalDespesas  = despesas.reduce((s, l) => s + l.valorCentavos, 0)
    const totalCreditos  = creditos.reduce((s, l) => s + l.valorCentavos, 0)
    const totalFatura    = Math.max(0, totalDespesas - totalCreditos)

    const limite      = conta.limiteCentavos ?? 0
    const disponivel  = Math.max(0, limite - totalFatura)
    const percentUsado = limite > 0 ? Math.min(100, Math.round((totalFatura / limite) * 100)) : 0

    // Category breakdown — expenses only, sorted by value desc
    const catMap: Record<string, { totalCentavos: number; count: number }> = {}
    for (const l of despesas) {
      const cat = l.categoria || 'Sem categoria'
      catMap[cat] ??= { totalCentavos: 0, count: 0 }
      catMap[cat].totalCentavos += l.valorCentavos
      catMap[cat].count++
    }
    const porCategoria = Object.entries(catMap)
      .map(([categoria, v]) => ({
        categoria,
        totalCentavos: v.totalCentavos,
        count: v.count,
        percent: totalDespesas > 0 ? Math.round((v.totalCentavos / totalDespesas) * 100) : 0,
      }))
      .sort((a, b) => b.totalCentavos - a.totalCentavos)

    // Navigation — next cycle only available if we're not already on the current open cycle
    const prev = prevFechamento(cycle.fechamento, conta.diaFechamento)
    const next = nextFechamento(cycle.fechamento, conta.diaFechamento)
    const currentCycle = getCurrentCycle(conta.diaFechamento, conta.diaVencimento, today)
    const isCurrentCycle = cycle.fechamento === currentCycle.fechamento

    return okResponse({
      conta: {
        id: conta.id,
        nome: conta.nome,
        cor: conta.cor,
        limiteCentavos: limite,
        diaFechamento: conta.diaFechamento,
        diaVencimento: conta.diaVencimento,
      },
      ciclo: cycle,
      totais: {
        totalFaturaCentavos: totalFatura,
        totalDespesasCentavos: totalDespesas,
        totalCreditosCentavos: totalCreditos,
        limiteCentavos: limite,
        disponivelCentavos: disponivel,
        percentUsado,
      },
      lancamentos: lancamentos.map(l => ({
        id: l.id,
        descricao: l.descricao,
        tipo: l.tipo,
        categoria: l.categoria,
        valorCentavos: l.valorCentavos,
        data: (l.data as Date).toISOString().slice(0, 10),
      })),
      porCategoria,
      cicloAnterior: prev,
      proximoCiclo: isCurrentCycle ? null : next,
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
