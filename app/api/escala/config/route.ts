import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiUser, okResponse, errorResponse, serverErrorResponse, unauthorizedResponse } from '@/lib/api-auth'

const HR_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIPOS_VALIDOS = ['12x24-12x72', '12x24-12x48', '24x48', '24x72', '12x36-folgao']

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const config = await prisma.escalaConfig.findUnique({
      where: { userId: user.id },
    })

    return okResponse({ config: config || null })
  } catch (err) {
    console.error('[escala.config.GET]', err)
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { tipo, hora_inicio, hora_fim, inicio_ciclo, local, alarme_ativo } = body

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return errorResponse('Tipo de escala inválido', 400)
    }
    if (!HR_RE.test(hora_inicio) || !HR_RE.test(hora_fim)) {
      return errorResponse('Horário inválido (use HH:mm)', 400)
    }
    if (!DATE_RE.test(inicio_ciclo)) {
      return errorResponse('Data de início inválida', 400)
    }

    const config = await prisma.escalaConfig.upsert({
      where: { userId: user.id },
      update: {
        tipo,
        horaInicio: hora_inicio,
        horaFim: hora_fim,
        inicioCiclo: inicio_ciclo,
        localServico: local || null,
        alarmeAtivo: alarme_ativo !== false,
        atualizadoEm: new Date(),
      },
      create: {
        userId: user.id,
        tipo,
        horaInicio: hora_inicio,
        horaFim: hora_fim,
        inicioCiclo: inicio_ciclo,
        localServico: local || null,
        alarmeAtivo: alarme_ativo !== false,
      },
    })

    return okResponse({ config })
  } catch (err) {
    console.error('[escala.config.POST]', err)
    return serverErrorResponse(err)
  }
}

export async function DELETE() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    await prisma.escalaConfig.deleteMany({ where: { userId: user.id } })
    await prisma.escala.deleteMany({ where: { userId: user.id } })

    return okResponse({ deleted: true })
  } catch (err) {
    console.error('[escala.config.DELETE]', err)
    return serverErrorResponse(err)
  }
}
