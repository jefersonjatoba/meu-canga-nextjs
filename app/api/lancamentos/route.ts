import type { NextRequest } from 'next/server'
import {
  getApiUser,
  getApiUserWithPlan,
  okResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { checkLancamentos } from '@/lib/plan-checker'
import { PAYWALL_MSGS } from '@/lib/plans'
import {
  createLancamentoForUser,
  listLancamentosForUser,
  getLancamentosSummaryForUser,
  NotFoundOrForbiddenError,
  ContaNotFoundOrForbiddenError,
} from '@/server/services/lancamento.service'
import { CategoriaNotFoundOrForbiddenError } from '@/server/services/categoria.service'
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
    const user = await getApiUserWithPlan()
    if (!user) return unauthorizedResponse()

    const limitCheck = await checkLancamentos(user.id, user)
    if (!limitCheck.ok) {
      const msg = PAYWALL_MSGS[limitCheck.recurso!]
      return errorResponse(
        `${msg?.titulo ?? 'Limite atingido'}: ${msg?.descricao ?? `Você atingiu o limite de ${limitCheck.limite} lançamentos por mês no plano Free.`} Faça upgrade para o PRO e tenha lançamentos ilimitados.`,
        402
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const idempotencyKey = request.headers.get('x-idempotency-key') ?? undefined
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? request.headers.get('x-real-ip')
      ?? undefined

    const lancamento = await createLancamentoForUser(user.id, body, { idempotencyKey, ipAddress })
    return createdResponse(lancamento)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(err.errors[0].message)
    if (err instanceof NotFoundOrForbiddenError) return errorResponse(err.message, 404)
    if (err instanceof ContaNotFoundOrForbiddenError) return errorResponse(err.message, 404)
    if (err instanceof CategoriaNotFoundOrForbiddenError) return errorResponse(err.message, 404)
    return serverErrorResponse(err)
  }
}
