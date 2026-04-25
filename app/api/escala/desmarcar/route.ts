import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiUser, okResponse, errorResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    const { data, hora_inicio } = body

    if (!data || !hora_inicio) {
      return errorResponse('Data e horário são obrigatórios', 400)
    }

    // Parse date
    const [year, month, day] = data.split('-').map(Number)
    const dataEscalaDate = new Date(Date.UTC(year, month - 1, day))

    const result = await prisma.escala.deleteMany({
      where: {
        userId: user.id,
        dataEscala: dataEscalaDate,
        horaInicio: hora_inicio,
      },
    })

    return okResponse({ deleted: result.count })
  } catch (err) {
    console.error('[escala.desmarcar]', err)
    return serverErrorResponse(err)
  }
}
