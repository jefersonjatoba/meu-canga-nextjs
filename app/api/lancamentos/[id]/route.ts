import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import {
  updateLancamentoForUser,
  deleteLancamentoForUser,
  NotFoundOrForbiddenError,
} from '@/server/services/lancamento.service'
import { ZodError } from 'zod'

// ─── PATCH /api/lancamentos/[id] ─────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const updated = await updateLancamentoForUser(user.id, id, body)
    return okResponse(updated)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(err.errors[0].message)
    if (err instanceof NotFoundOrForbiddenError) return notFoundResponse('Lançamento')
    return serverErrorResponse(err)
  }
}

// ─── DELETE /api/lancamentos/[id] ────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    await deleteLancamentoForUser(user.id, id)
    return okResponse({ deleted: true })
  } catch (err) {
    if (err instanceof NotFoundOrForbiddenError) return notFoundResponse('Lançamento')
    return serverErrorResponse(err)
  }
}
