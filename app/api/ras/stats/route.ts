import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  okResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import {
  RAS_MAX_MONTHLY_HOURS,
  RAS_WARNING_THRESHOLD,
} from '@/types/ras'
import type { StatusRas, GraduacaoRas, DuracaoRas } from '@/types/ras'

// ─── GET /api/ras/stats ───────────────────────────────────────────────────────
// Returns aggregated RAS statistics for a given month (competência).

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    // Resolve competência from query params
    const mesParam = request.nextUrl.searchParams.get('mes') // yyyy-MM
    const anoParam = request.nextUrl.searchParams.get('ano') // yyyy (fallback)

    let competencia: string

    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      competencia = mesParam
    } else if (anoParam && /^\d{4}$/.test(anoParam)) {
      // If only year given, use current month of that year
      const nowBR = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
      )
      const month = String(nowBR.getMonth() + 1).padStart(2, '0')
      competencia = `${anoParam}-${month}`
    } else {
      // Default: current Brazil month
      const nowBR = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
      )
      const year = nowBR.getFullYear()
      const month = String(nowBR.getMonth() + 1).padStart(2, '0')
      competencia = `${year}-${month}`
    }

    if (!/^\d{4}-\d{2}$/.test(competencia)) {
      return errorResponse('Parâmetro "mes" deve estar no formato AAAA-MM')
    }

    // ── Fetch all non-cancelled RAS for this competência ──────────────────────
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

    // ── Aggregate totals ──────────────────────────────────────────────────────
    let totalHoras = 0
    let totalCentavos = 0
    let totalEventos = 0
    let eventosPendentes = 0
    let eventosConfirmados = 0

    const horasPorGraduacao: Record<string, number> = {}
    const contagemPorStatus: Record<StatusRas, number> = {
      agendado: 0,
      realizado: 0,
      pendente: 0,
      confirmado: 0,
      cancelado: 0,
    }

    for (const ra of rasAgendas) {
      const status = ra.status as StatusRas
      const graduacao = ra.graduacao as GraduacaoRas

      totalHoras += ra.duracao
      totalCentavos += ra.valorCentavos
      totalEventos++

      contagemPorStatus[status] = (contagemPorStatus[status] ?? 0) + 1

      if (status === 'pendente') eventosPendentes++
      if (status === 'confirmado') eventosConfirmados++

      horasPorGraduacao[graduacao] =
        (horasPorGraduacao[graduacao] ?? 0) + ra.duracao
    }

    const percentualLimite = Math.min(
      Math.round((totalHoras / RAS_MAX_MONTHLY_HOURS) * 100),
      100
    )

    const horasRestantes = Math.max(RAS_MAX_MONTHLY_HOURS - totalHoras, 0)

    return okResponse({
      competencia,
      totalHoras,
      totalCentavos,
      totalEventos,
      eventosPendentes,
      eventosConfirmados,
      percentualLimite,
      alertaLimite: totalHoras >= RAS_WARNING_THRESHOLD,
      horasRestantes,
      horasPorGraduacao,
      contagemPorStatus,
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
