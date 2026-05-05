import { okResponse, serverErrorResponse, errorResponse, unauthorizedResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'
import { getApiUser } from '@/lib/api-auth'

async function handleClean(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const qs = Object.fromEntries(request.nextUrl.searchParams.entries())
    const data = qs.data || '2026-05-05'
    const confirm = qs.confirm === 'true'

    if (!confirm) {
      return errorResponse('Adicione ?confirm=true para confirmar a limpeza')
    }

    const [y, m, d] = data.split('-').map(Number)
    const dayStart = new Date(Date.UTC(y, m - 1, d))
    const dayEnd = new Date(Date.UTC(y, m - 1, d))
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

    // Hard delete all cancelled RAS for this date
    const { count } = await prisma.rasAgenda.deleteMany({
      where: {
        userId: user.id,
        data: { gte: dayStart, lt: dayEnd },
        status: 'cancelado',
      },
    })

    return okResponse({
      success: true,
      message: `Deletados ${count} RAS cancelados em ${data}`,
      deleted: count,
      date: data,
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  return handleClean(request)
}

export async function GET(request: NextRequest) {
  return handleClean(request)
}
