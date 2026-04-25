import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'

// ─── GET /api/escala/stats ────────────────────────────────────────────────────
// Returns stats for the current month (Brazil timezone).

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    // Determine current month bounds in America/Sao_Paulo
    const nowBR = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    )
    const year = nowBR.getFullYear()
    const month = nowBR.getMonth() // 0-indexed

    const mesParam = request.nextUrl.searchParams.get('mes') // yyyy-MM optional
    let startDate: Date
    let endDate: Date

    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      const [y, m] = mesParam.split('-').map(Number)
      startDate = new Date(Date.UTC(y, m - 1, 1))
      endDate = new Date(Date.UTC(y, m, 1))
    } else {
      startDate = new Date(Date.UTC(year, month, 1))
      endDate = new Date(Date.UTC(year, month + 1, 1))
    }

    const [agendadas, realizadas, canceladas, proximaEscala] =
      await Promise.all([
        prisma.escala.count({
          where: {
            userId: user.id,
            status: 'agendada',
            dataEscala: { gte: startDate, lt: endDate },
          },
        }),
        prisma.escala.count({
          where: {
            userId: user.id,
            status: 'realizada',
            dataEscala: { gte: startDate, lt: endDate },
          },
        }),
        prisma.escala.count({
          where: {
            userId: user.id,
            status: 'cancelada',
            dataEscala: { gte: startDate, lt: endDate },
          },
        }),
        prisma.escala.findFirst({
          where: {
            userId: user.id,
            status: 'agendada',
            dataEscala: {
              gte: new Date(Date.UTC(year, month, nowBR.getDate())),
            },
          },
          orderBy: { dataEscala: 'asc' },
        }),
      ])

    return okResponse({
      totalAgendadas: agendadas,
      totalRealizadas: realizadas,
      totalCanceladas: canceladas,
      proximaEscala,
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
