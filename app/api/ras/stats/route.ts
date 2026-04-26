import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import {
  RAS_MAX_MONTHLY_HOURS,
  RAS_WARNING_THRESHOLD,
} from '@/types/ras'
import type { StatusRas, GraduacaoRas, RasHistoricoMes } from '@/types/ras'

// ─── GET /api/ras/stats ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const mesParam = request.nextUrl.searchParams.get('mes') // yyyy-MM
    const anoParam = request.nextUrl.searchParams.get('ano') // yyyy (fallback)

    let competencia: string

    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      competencia = mesParam
    } else if (anoParam && /^\d{4}$/.test(anoParam)) {
      const nowBR = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
      )
      const month = String(nowBR.getMonth() + 1).padStart(2, '0')
      competencia = `${anoParam}-${month}`
    } else {
      const nowBR = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
      )
      competencia = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}`
    }

    if (!/^\d{4}-\d{2}$/.test(competencia)) {
      return errorResponse('Parâmetro "mes" deve estar no formato AAAA-MM')
    }

    const rasAgendas = await prisma.rasAgenda.findMany({
      where: {
        userId: user.id,
        competencia,
        status: { notIn: ['cancelado'] },
      },
      select: {
        duracao: true,
        status: true,
        graduacao: true,
        valorCentavos: true,
      },
    })

    let totalHoras = 0
    let totalCentavos = 0
    let totalEventos = 0
    let eventosPendentes = 0
    let eventosConfirmados = 0

    const horasPorGraduacao: Record<string, number> = {}
    const contagemPorStatus: Record<StatusRas, number> = {
      agendado: 0, realizado: 0, pendente: 0, confirmado: 0, cancelado: 0,
    }
    const horasPorStatus: Record<StatusRas, number> = {
      agendado: 0, realizado: 0, pendente: 0, confirmado: 0, cancelado: 0,
    }
    const centavosPorStatus: Record<StatusRas, number> = {
      agendado: 0, realizado: 0, pendente: 0, confirmado: 0, cancelado: 0,
    }

    for (const ra of rasAgendas) {
      const status = ra.status as StatusRas
      const graduacao = ra.graduacao as GraduacaoRas

      totalHoras += ra.duracao
      totalCentavos += ra.valorCentavos
      totalEventos++

      contagemPorStatus[status] = (contagemPorStatus[status] ?? 0) + 1
      horasPorStatus[status] = (horasPorStatus[status] ?? 0) + ra.duracao
      centavosPorStatus[status] = (centavosPorStatus[status] ?? 0) + ra.valorCentavos

      if (status === 'pendente') eventosPendentes++
      if (status === 'confirmado') eventosConfirmados++

      horasPorGraduacao[graduacao] = (horasPorGraduacao[graduacao] ?? 0) + ra.duracao
    }

    const percentualLimite = Math.min(
      Math.round((totalHoras / RAS_MAX_MONTHLY_HOURS) * 100),
      100
    )

    // ── Histórico 3 meses anteriores (confirmados) ───────────────────────────
    const [cy, cm] = competencia.split('-').map(Number)
    const prev3: string[] = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(cy, cm - 1 - i, 1)
      prev3.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const hist3Raw = await prisma.rasAgenda.groupBy({
      by: ['competencia'],
      where: {
        userId: user.id,
        status: 'confirmado',
        competencia: { in: prev3 },
      },
      _sum: { duracao: true, valorCentavos: true },
    })

    const historico3Meses: RasHistoricoMes[] = prev3.map((comp) => {
      const found = hist3Raw.find((r) => r.competencia === comp)
      return {
        competencia: comp,
        totalHoras: found?._sum.duracao ?? 0,
        totalCentavos: found?._sum.valorCentavos ?? 0,
      }
    })

    return okResponse({
      competencia,
      totalHoras,
      totalCentavos,
      totalEventos,
      eventosPendentes,
      eventosConfirmados,
      percentualLimite,
      alertaLimite: totalHoras >= RAS_WARNING_THRESHOLD,
      horasRestantes: Math.max(RAS_MAX_MONTHLY_HOURS - totalHoras, 0),
      horasPorGraduacao,
      contagemPorStatus,
      horasPorStatus,
      centavosPorStatus,
      historico3Meses,
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
