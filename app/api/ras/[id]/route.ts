import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { updateRasAgendaSchema } from '@/lib/validations/ras'
import * as rasService from '@/server/services/ras.service'
import { RasDomainError, RasErrorCode } from '@/lib/ras-errors'
import type { StatusRas } from '@/types/ras'

// ─── Helper: map RasDomainError → HTTP response ───────────────────────────────

function domainErrorResponse(err: RasDomainError) {
  const { code, message } = err.response
  switch (code) {
    case RasErrorCode.NOT_FOUND:
      return notFoundResponse('RAS')
    case RasErrorCode.FORBIDDEN:
      return errorResponse(message, 403)
    case RasErrorCode.TRANSITION_INVALID:
      return errorResponse(message, 422)
    default:
      return errorResponse(message, 400)
  }
}

// ─── GET /api/ras/[id] ────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const rasAgenda = await prisma.rasAgenda.findFirst({
      where: { id, userId: user.id },
      include: { agendamentos: true, pagamentos: true },
    })

    if (!rasAgenda) return notFoundResponse('RAS')

    return okResponse(rasAgenda)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── PATCH /api/ras/[id] ──────────────────────────────────────────────────────
// Routes status transitions through rasService to enforce the state machine.
// Non-status field changes (reschedule) remain direct for now.

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = updateRasAgendaSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const updates = parsed.data

    // ── Status transitions via service (enforces state machine) ──────────────
    if (updates.status && Object.keys(updates).length === 1) {
      const newStatus = updates.status as StatusRas
      try {
        let updated
        switch (newStatus) {
          case 'realizado': {
            const result = await rasService.marcarRealizado(id, user.id)
            updated = result.ras
            break
          }
          case 'pendente':
            updated = await rasService.marcarPendente(id, user.id)
            break
          case 'confirmado':
            updated = await rasService.confirmarRas(id, user.id, updates.observacoes ?? undefined)
            break
          case 'cancelado':
            updated = await rasService.cancelarRas(id, user.id)
            break
          default:
            return errorResponse(`Transição para "${newStatus}" não suportada nesta rota`, 422)
        }
        return okResponse(updated)
      } catch (err) {
        if (err instanceof RasDomainError) return domainErrorResponse(err)
        throw err
      }
    }

    // ── Mixed update (field changes + optional status) ────────────────────────
    // Verify ownership first
    const existing = await prisma.rasAgenda.findFirst({ where: { id, userId: user.id } })
    if (!existing) return notFoundResponse('RAS')

    // Prevent any field changes on confirmed RAS
    if (existing.status === 'confirmado') {
      return errorResponse('Não é possível alterar dados de um RAS confirmado', 422)
    }

    // Validate status transition if status is being changed alongside field edits
    if (updates.status) {
      const currentStatus = existing.status as StatusRas
      const newStatus = updates.status as StatusRas
      const VALID_TRANSITIONS: Record<StatusRas, StatusRas[]> = {
        agendado:   ['realizado', 'cancelado'],
        realizado:  ['pendente', 'confirmado', 'cancelado'],
        pendente:   ['confirmado', 'cancelado'],
        confirmado: [],
        cancelado:  [],
      }
      if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
        return errorResponse(
          `Transição de status inválida: "${currentStatus}" → "${newStatus}"`,
          422
        )
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...updates }

    // Set expiresAt window when marking as realizado
    if (updates.status === 'realizado') {
      const eventDateStr = existing.data.toISOString().slice(0, 10)
      const [eh, em] = existing.horaInicio.split(':').map(Number)
      const eventStartSP = new Date(
        new Date(`${eventDateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00-03:00`).getTime()
      )
      updateData.expiresAt = new Date(eventStartSP.getTime() + 72 * 60 * 60 * 1000)
    }

    // Parse new date if rescheduling
    if (updates.data) {
      const [year, month, day] = updates.data.split('-').map(Number)
      const newDate = new Date(Date.UTC(year, month - 1, day))

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
        return errorResponse('Já existe um RAS agendado para esta data e horário', 409)
      }

      updateData.data = newDate
    }

    const updated = await prisma.rasAgenda.update({
      where: { id },
      data: updateData,
      include: { agendamentos: true, pagamentos: true },
    })

    return okResponse(updated)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── DELETE /api/ras/[id] ─────────────────────────────────────────────────────
// Soft delete (GDPR compliance): marks RAS as deleted, preserves audit trail.
// Optional body: { motivo: "string" } for deletion reason.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    // Optional body with motivo
    const body = await request.json().catch(() => ({}))
    const motivo = (body as { motivo?: string }).motivo

    try {
      await rasService.deletarRas(id, user.id, motivo)
      return okResponse({ message: 'RAS deletado com sucesso' })
    } catch (err) {
      if (err instanceof RasDomainError) return domainErrorResponse(err)
      throw err
    }
  } catch (err) {
    return serverErrorResponse(err)
  }
}
