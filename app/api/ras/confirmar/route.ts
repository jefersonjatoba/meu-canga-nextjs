import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { isWithinConfirmationWindow } from '@/lib/ras-calculations'

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

    const rasAgenda = await prisma.rasAgenda.findUnique({
      where: { id: body.id },
    })

    if (!rasAgenda) return notFoundResponse('RAS')
    if (rasAgenda.userId !== user.id) return forbiddenResponse()

    if (rasAgenda.status === 'confirmado') {
      return errorResponse('O RAS já está confirmado', 409)
    }

    if (rasAgenda.status === 'cancelado') {
      return errorResponse('Não é possível confirmar um RAS cancelado', 422)
    }

    if (rasAgenda.status === 'agendado') {
      return errorResponse(
        'O RAS ainda não foi realizado. Marque-o como realizado antes de confirmar.',
        422
      )
    }

    // status is 'realizado' or 'pendente' — both are confirmable
    const updated = await prisma.rasAgenda.update({
      where: { id: body.id },
      data: {
        status: 'confirmado',
        observacoes: body.observacoes ?? rasAgenda.observacoes,
      },
      include: { agendamentos: true, pagamentos: true },
    })

    return okResponse(updated)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
