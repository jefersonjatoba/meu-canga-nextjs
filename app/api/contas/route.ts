// GET  /api/contas - lista contas ativas do usuario autenticado
// POST /api/contas - cria nova conta

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  getApiUser,
  okResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { currentMonthBR, todayBR } from '@/lib/dates'
import { getCurrentCycle } from '@/lib/billing-cycle'

const TIPOS_CONTA = ['checking', 'savings', 'credit', 'investment', 'wallet', 'custom'] as const

const createContaSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio').max(100, 'Nome muito longo'),
  tipo: z.enum(TIPOS_CONTA, { errorMap: () => ({ message: 'Tipo de conta invalido' }) }),
  banco: z.string().max(100).optional(),
  cor: z.string().max(20).optional(), // hex (#rrggbb) or gradient "hex,hex"
  saldoCentavos: z.number().int().default(0),
  limiteCentavos: z.number().int().positive().optional().nullable(),
  diaFechamento: z.number().int().min(1).max(31).optional().nullable(),
  diaVencimento: z.number().int().min(1).max(31).optional().nullable(),
}).refine(
  data => data.tipo !== 'credit' || (data.diaFechamento != null && data.diaVencimento != null),
  { message: 'Cartao de credito precisa de fechamento e vencimento' },
)

const contaSelect = {
  id: true,
  nome: true,
  tipo: true,
  banco: true,
  cor: true,
  saldoCentavos: true,
  limiteCentavos: true,
  diaFechamento: true,
  diaVencimento: true,
  ativa: true,
  createdAt: true,
} as const

// Tipos que representam dinheiro ENTRANDO na conta (do ponto de vista do saldo da conta)
const INCOME_TIPOS = ['income', 'ras', 'investment_resgate']
// Tipos que representam dinheiro SAINDO da conta
const EXPENSE_TIPOS = ['expense', 'investment_aporte']

function buildMovMap(rows: { contaId: string; tipo: string; _sum: { valorCentavos: number | null } }[]) {
  const map: Record<string, { entradas: number; saidas: number }> = {}
  for (const row of rows) {
    if (!map[row.contaId]) map[row.contaId] = { entradas: 0, saidas: 0 }
    const val = row._sum.valorCentavos ?? 0
    if (INCOME_TIPOS.includes(row.tipo))  map[row.contaId].entradas += val
    else if (EXPENSE_TIPOS.includes(row.tipo)) map[row.contaId].saidas += val
  }
  return map
}

async function attachStats<T extends {
  id: string
  saldoCentavos: number
  tipo: string
  limiteCentavos?: number | null
  diaFechamento?: number | null
  diaVencimento?: number | null
}>(contas: T[], userId: string) {
  if (contas.length === 0) return contas.map(c => ({
    ...c,
    entradasCentavos: 0,
    saidasCentavos: 0,
    saldoAtualCentavos: c.saldoCentavos,
    faturaAtualCentavos: null as number | null,
    limiteDisponivelCentavos: null as number | null,
  }))

  const contaIds = contas.map(c => c.id)
  const mesAtual = currentMonthBR()
  const today    = todayBR()

  // Mapa contaId → competencia do ciclo atual (só cartões de crédito configurados)
  const creditCompetencias: Record<string, string> = {}
  for (const conta of contas) {
    if (conta.tipo === 'credit' && conta.diaFechamento && conta.diaVencimento) {
      const cycle = getCurrentCycle(conta.diaFechamento, conta.diaVencimento, today)
      creditCompetencias[conta.id] = cycle.vencimento.slice(0, 7)
    }
  }
  const creditContaIds = Object.keys(creditCompetencias)

  // Três queries paralelas:
  // 1. histórico completo → saldo real de contas correntes/poupança/etc.
  // 2. mês atual          → Entradas / Saídas exibidas nos cards
  // 3. faturas ativas     → fatura do ciclo atual de cada cartão de crédito
  const [allTime, thisMonth, faturasDoMes] = await Promise.all([
    prisma.lancamento.groupBy({
      by: ['contaId', 'tipo'],
      where: { contaId: { in: contaIds }, status: 'confirmada', deletadoEm: null },
      _sum: { valorCentavos: true },
    }),
    prisma.lancamento.groupBy({
      by: ['contaId', 'tipo'],
      where: { contaId: { in: contaIds }, status: 'confirmada', deletadoEm: null, competenciaAt: mesAtual },
      _sum: { valorCentavos: true },
    }),
    creditContaIds.length > 0
      ? prisma.faturaCartao.findMany({
          where: {
            userId,
            contaId: { in: creditContaIds },
            status: { not: 'cancelada' },
          },
          select: { contaId: true, competencia: true, totalCentavos: true },
        })
      : Promise.resolve([]),
  ])

  const balanceMap = buildMovMap(allTime)
  const monthMap   = buildMovMap(thisMonth)

  // Apenas a fatura do ciclo atual de cada cartão (competencia exata)
  const faturaMap: Record<string, number> = {}
  for (const f of faturasDoMes) {
    if (creditCompetencias[f.contaId] === f.competencia) {
      faturaMap[f.contaId] = f.totalCentavos
    }
  }

  return contas.map(c => {
    const allEntradas = balanceMap[c.id]?.entradas ?? 0
    const allSaidas   = balanceMap[c.id]?.saidas   ?? 0
    const faturaAtualCentavos = c.tipo === 'credit'
      ? (faturaMap[c.id] ?? 0)
      : null

    // Para cartão, o "saldo atual" do payload precisa refletir o passivo do ciclo
    // atual, e não um acumulado histórico sem quitação.
    const saldoAtualCentavos = c.tipo === 'credit'
      ? (faturaAtualCentavos ?? 0)
      : c.saldoCentavos + allEntradas - allSaidas

    // Entradas/Saídas exibidas nos cards = apenas o mês atual
    const entradasCentavos = monthMap[c.id]?.entradas ?? 0
    const saidasCentavos   = monthMap[c.id]?.saidas   ?? 0

    // Campos exclusivos de cartão de crédito
    const limiteDisponivelCentavos = c.tipo === 'credit'
      ? Math.max(0, (c.limiteCentavos ?? 0) - (faturaMap[c.id] ?? 0))
      : null

    return { ...c, entradasCentavos, saidasCentavos, saldoAtualCentavos, faturaAtualCentavos, limiteDisponivelCentavos }
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const ativaParam = request.nextUrl.searchParams.get('ativa')
    const ativa = ativaParam === 'false' ? false : true

    const contas = await prisma.conta.findMany({
      where: { userId: user.id, ativa },
      select: contaSelect,
      orderBy: { createdAt: 'asc' },
    })

    const result = await attachStats(contas, user.id)
    return okResponse(result)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const parsed = createContaSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const { nome, tipo, banco, cor, saldoCentavos, limiteCentavos, diaFechamento, diaVencimento } = parsed.data

    const conta = await prisma.conta.create({
      data: {
        userId: user.id,
        nome,
        tipo,
        banco,
        cor,
        saldoCentavos,
        limiteCentavos: tipo === 'credit' ? limiteCentavos : null,
        diaFechamento:  tipo === 'credit' ? diaFechamento  : null,
        diaVencimento:  tipo === 'credit' ? diaVencimento  : null,
      },
      select: contaSelect,
    })

    const [result] = await attachStats([conta], user.id)
    return createdResponse(result)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
