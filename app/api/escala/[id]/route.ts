import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { updateEscalaSchema } from '@/lib/validations/escala'

// ─── GET /api/escala/[id] ────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    const { id } = await params

    const escala = await prisma.escala.findUnique({ where: { id } })
    if (!escala) return notFoundResponse('Escala')
    if (escala.userId !== user.id) return forbiddenResponse()

    return okResponse(escala)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── PATCH /api/escala/[id] ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await prisma.escala.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Escala')
    if (existing.userId !== user.id) return forbiddenResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = updateEscalaSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const updates = parsed.data

    // ── Business rule validations ─────────────────────────────────────────────

    // Cannot change a "realizada" escala back to "agendada"
    if (existing.status === 'realizada' && updates.status === 'agendada') {
      return errorResponse(
        'Não é possível reverter uma escala realizada para agendada'
      )
    }

    // Cannot cancel a realized escala
    if (existing.status === 'realizada' && updates.status === 'cancelada') {
      return errorResponse('Não é possível cancelar uma escala já realizada')
    }

    // To mark as "realizada" the escala date must be <= today (Brazil time)
    if (updates.status === 'realizada') {
      const todayBR = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
      )
      todayBR.setHours(23, 59, 59, 999)
      if (new Date(existing.dataEscala) > todayBR) {
        return errorResponse(
          'Só é possível marcar como realizada após a data da escala'
        )
      }
    }

    // Validate new date uniqueness if date is changing
    if (updates.dataEscala) {
      const [year, month, day] = updates.dataEscala.split('-').map(Number)
      const newDate = new Date(Date.UTC(year, month - 1, day))

      const duplicate = await prisma.escala.findFirst({
        where: {
          userId: user.id,
          dataEscala: newDate,
          status: { not: 'cancelada' },
          id: { not: id },
        },
      })

      if (duplicate) {
        return errorResponse(
          'Já existe uma escala agendada para esta data',
          409
        )
      }

      // Reassign parsed date to the update payload
      Object.assign(updates, { dataEscala: newDate })
    }

    const updated = await prisma.escala.update({
      where: { id },
      data: updates,
    })

    return okResponse(updated)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── DELETE /api/escala/[id] ──────────────────────────────────────────────────
// Soft-cancel if agendada; hard-delete if explicitly requested.
// For now: sets status = 'cancelada' (keeps history).

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    const { id } = await params

    const existing = await prisma.escala.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('Escala')
    if (existing.userId !== user.id) return forbiddenResponse()

    if (existing.status === 'realizada') {
      return errorResponse('Não é possível cancelar uma escala já realizada')
    }

    const cancelled = await prisma.escala.update({
      where: { id },
      data: { status: 'cancelada' },
    })

    return okResponse(cancelled)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
