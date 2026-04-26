import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import {
  createLancamentoForUser,
  listLancamentosForUser,
  getLancamentosSummaryForUser,
  NotFoundOrForbiddenError,
} from '@/server/services/lancamento.service'
import { ZodError } from 'zod'

// ─── GET /api/lancamentos ─────────────────────────────────────────────────────
// Query params: mes, tipo, contaId, categoria, status, page, pageSize
// Add ?summary=1 to get the financial summary for the requested month.

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())

    if (params.summary === '1') {
      const mes = params.mes ?? new Date().toISOString().slice(0, 7)
      const summary = await getLancamentosSummaryForUser(user.id, mes)
      return okResponse(summary)
    }

    const data = await listLancamentosForUser(user.id, params)
    return okResponse(data)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(err.errors[0].message)
    return serverErrorResponse(err)
  }
}

// ─── POST /api/lancamentos ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const lancamento = await createLancamentoForUser(user.id, body)
    return createdResponse(lancamento)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(err.errors[0].message)
    if (err instanceof NotFoundOrForbiddenError) return errorResponse(err.message, 404)
    return serverErrorResponse(err)
  }
}
