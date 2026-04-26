import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiUser, okResponse, errorResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()

    const { data, hora_inicio, hora_fim, tipo, local, observacao, alarme_ativo } = body

    if (!data || !hora_inicio) {
      return errorResponse('Data e horário são obrigatórios', 400)
    }

    // Parse date
    const [year, month, day] = data.split('-').map(Number)
    const dataEscalaDate = new Date(Date.UTC(year, month - 1, day))

    // Upsert: ON CONFLICT(userId, dataEscala, horaInicio) DO UPDATE — idêntico ao v1
    const existing = await prisma.escala.findFirst({
      where: {
        userId: user.id,
        dataEscala: dataEscalaDate,
        horaInicio: hora_inicio,
      },
    })

    let escala
    if (existing) {
      escala = await prisma.escala.update({
        where: { id: existing.id },
        data: {
          tipoTurno: tipo || 'plantao',
          horaFim: hora_fim || '19:00',
          localServico: local || null,
          observacoes: observacao || null,
          alarmeAtivo: alarme_ativo !== false,
          status: 'agendada',
        },
      })
    } else {
      escala = await prisma.escala.create({
        data: {
          userId: user.id,
          dataEscala: dataEscalaDate,
          tipoTurno: tipo || 'plantao',
          horaInicio: hora_inicio || '07:00',
          horaFim: hora_fim || '19:00',
          localServico: local || null,
          observacoes: observacao || null,
          alarmeAtivo: alarme_ativo !== false,
          status: 'agendada',
        },
      })
    }

    return okResponse(escala)
  } catch (err) {
    console.error('[escala.marcar]', err)
    return serverErrorResponse(err)
  }
}
