import { getApiUser, okResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const qs = Object.fromEntries(request.nextUrl.searchParams.entries())
    const data = qs.data || '2026-05-05'

    const dayStart = new Date(Date.UTC(...data.split('-').map(Number).slice(0, 3)))
    const dayEnd = new Date(Date.UTC(...data.split('-').map(Number).slice(0, 3)))
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

    const all = await prisma.rasAgenda.findMany({
      where: {
        userId: user.id,
        data: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { horaInicio: 'asc' },
    })

    return okResponse({
      date: data,
      found: all.length,
      records: all.map((r) => ({
        id: r.id,
        data: r.data.toISOString(),
        horaInicio: r.horaInicio,
        horaFim: r.horaFim,
        duracao: r.duracao,
        status: r.status,
        deletadoEm: r.deletadoEm?.toISOString() || null,
      })),
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
