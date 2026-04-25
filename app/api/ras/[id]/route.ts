import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  okResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { updateRasAgendaSchema } from '@/lib/validations/ras'
import type { StatusRas } from '@/types/ras'

// ─── Valid status transitions ─────────────────────────────────────────────────
// agendado → realizado → pendente → confirmado
// Any non-confirmed status → cancelado

const ALLOWED_TRANSITIONS: Record<StatusRas, StatusRas[]> = {
  agendado: ['realizado', 'cancelado'],
  realizado: ['pendente', 'cancelado'],
  pendente: ['confirmado', 'cancelado'],
  confirmado: [],
  cancelado: [],
}

// ─── GET /api/ras/[id] ────────────────────────────────────────────────────────

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

    const rasAgenda = await prisma.rasAgenda.findUnique({
      where: { id },
      include: {
        agendamentos: true,
        pagamentos: true,
      },
    })

    if (!rasAgenda) return notFoundResponse('RAS')
    if (rasAgenda.userId !== user.id) return forbiddenResponse()

    return okResponse(rasAgenda)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── PATCH /api/ras/[id] ──────────────────────────────────────────────────────

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

    const existing = await prisma.rasAgenda.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('RAS')
    if (existing.userId !== user.id) return forbiddenResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = updateRasAgendaSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const updates = parsed.data

    // ── Status transition validation ─────────────────────────────────────────
    if (updates.status) {
      const currentStatus = existing.status as StatusRas
      const newStatus = updates.status as StatusRas
      const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

      if (!allowed.includes(newStatus)) {
        return errorResponse(
          `Transição de status inválida: "${currentStatus}" → "${newStatus}"`,
          422
        )
      }
    }

    // ── Prevent changes to realizado/confirmado (except status transitions) ──
    const immutableStatuses: StatusRas[] = ['confirmado']
    if (immutableStatuses.includes(existing.status as StatusRas)) {
      const hasFieldChange = Object.keys(updates).some((k) => k !== 'status')
      if (hasFieldChange) {
        return errorResponse(
          'Não é possível alterar dados de um RAS confirmado',
          422
        )
      }
    }

    // ── Parse new date if rescheduling ────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...updates }

    if (updates.data) {
      const [year, month, day] = updates.data.split('-').map(Number)
      const newDate = new Date(Date.UTC(year, month - 1, day))

      // Check for duplicate booking at new date+time
      const horaInicio = updates.horaInicio ?? existing.horaInicio
      const duplicate = await prisma.rasAgenda.findFirst({
        where: {
          userId: user.id,
          data: newDate,
          horaInicio,
          status: { notIn: ['cancelado'] },
          id: { not: id },
        },
      })

      if (duplicate) {
        return errorResponse(
          'Já existe um RAS agendado para esta data e horário',
          409
        )
      }

      updateData.data = newDate
    }

    const updated = await prisma.rasAgenda.update({
      where: { id },
      data: updateData,
      include: {
        agendamentos: true,
        pagamentos: true,
      },
    })

    return okResponse(updated)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── DELETE /api/ras/[id] ─────────────────────────────────────────────────────
// Soft-cancel: sets status = 'cancelado'. Not allowed if already confirmed.

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

    const existing = await prisma.rasAgenda.findUnique({ where: { id } })
    if (!existing) return notFoundResponse('RAS')
    if (existing.userId !== user.id) return forbiddenResponse()

    if (existing.status === 'confirmado') {
      return errorResponse(
        'Não é possível cancelar um RAS já confirmado',
        422
      )
    }

    if (existing.status === 'cancelado') {
      return errorResponse('O RAS já está cancelado', 422)
    }

    const cancelled = await prisma.rasAgenda.update({
      where: { id },
      data: { status: 'cancelado' },
      include: {
        agendamentos: true,
        pagamentos: true,
      },
    })

    return okResponse(cancelled)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
