import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { isWithinConfirmationWindow } from '@/lib/ras-calculations'
import * as rasService from '@/server/services/ras.service'
import { RasDomainError, RasErrorCode } from '@/lib/ras-errors'

function domainErrorResponse(err: RasDomainError) {
  const { code, message } = err.response
  switch (code) {
    case RasErrorCode.NOT_FOUND:
      return errorResponse(message, 404)
    case RasErrorCode.FORBIDDEN:
      return errorResponse(message, 403)
    case RasErrorCode.TRANSITION_INVALID:
      return errorResponse(message, 422)
    default:
      return errorResponse(message, 400)
  }
}

// ─── POST /api/ras/confirmar ──────────────────────────────────────────────────
// Confirma um RAS específico (transição realizado/pendente → confirmado).
// Aplica-se regra dos 72 h: o RAS deve ter sido realizado dentro da janela.
// Body: { id: string; observacoes?: string }
//
// Também pode ser invocado sem body como endpoint de auto-confirmação em batch:
// Body: { batch: true } — confirma todos os RAS realizado/pendente elegíveis.

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    // ── Batch auto-confirmation ───────────────────────────────────────────────
    if (body.batch === true) {
      const now = new Date()

      // Fetch all realizado/pendente RAS for this user
      const candidatos = await prisma.rasAgenda.findMany({
        where: {
          userId: user.id,
          status: { in: ['realizado', 'pendente'] },
        },
        select: {
          id: true,
          data: true,
          horaInicio: true,
          status: true,
          expiresAt: true,
        },
      })

      const toConfirm: string[] = []
      const expired: string[] = []

      for (const r of candidatos) {
        const withinWindow = isWithinConfirmationWindow(r.data, now)

        if (withinWindow) {
          toConfirm.push(r.id)
        } else if (r.expiresAt && r.expiresAt < now) {
          // Window expired → pendente (will be picked up by cron)
          expired.push(r.id)
        }
      }

      const [confirmed, transitioned] = await Promise.all([
        toConfirm.length > 0
          ? prisma.rasAgenda.updateMany({
              where: { id: { in: toConfirm }, userId: user.id },
              data: { status: 'confirmado' },
            })
          : Promise.resolve({ count: 0 }),
        expired.length > 0
          ? prisma.rasAgenda.updateMany({
              where: {
                id: { in: expired },
                userId: user.id,
                status: 'realizado',
              },
              data: { status: 'pendente' },
            })
          : Promise.resolve({ count: 0 }),
      ])

      return okResponse({
        confirmados: confirmed.count,
        transicionadosParaPendente: transitioned.count,
        idsConfirmados: toConfirm,
        executadoEm: now.toISOString(),
      })
    }

    // ── Single RAS confirmation ───────────────────────────────────────────────
    if (!body.id || typeof body.id !== 'string') {
      return errorResponse('Campo "id" é obrigatório')
    }

    try {
      const updated = await rasService.confirmarRas(body.id, user.id, body.observacoes)
      return okResponse(updated)
    } catch (err) {
      if (err instanceof RasDomainError) {
        if (
          err.response.code === RasErrorCode.TRANSITION_INVALID &&
          err.response.details?.current === 'confirmado'
        ) {
          return errorResponse('O RAS já está confirmado', 409)
        }

        if (
          err.response.code === RasErrorCode.TRANSITION_INVALID &&
          err.response.details?.current === 'agendado'
        ) {
          return errorResponse(
            'O RAS ainda não foi realizado. Marque-o como realizado antes de confirmar.',
            422,
          )
        }

        if (
          err.response.code === RasErrorCode.TRANSITION_INVALID &&
          err.response.details?.current === 'cancelado'
        ) {
          return errorResponse('Não é possível confirmar um RAS cancelado', 422)
        }

        return domainErrorResponse(err)
      }
      throw err
    }
  } catch (err) {
    return serverErrorResponse(err)
  }
}
