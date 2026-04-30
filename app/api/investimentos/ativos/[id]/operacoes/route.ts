import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'

import { criarOperacaoSchema } from '@/features/investimentos/schemas'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  InvestmentAtivoInactiveError,
  InvestmentAtivoNotFoundOrForbiddenError,
  InvestmentContaCreditError,
  InvestmentContaNotFoundOrForbiddenError,
  InvestmentOperacaoInvalidError,
  InvestmentValidationError,
  registrarOperacao,
} from '@/server/services/investment.service'

const criarOperacaoBodySchema = criarOperacaoSchema.omit({ ativoId: true })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const validated = criarOperacaoBodySchema.parse(body)
    const ativo = await registrarOperacao(user.id, {
      ativoId: id,
      ...validated,
    })

    return createdResponse(ativo)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof InvestmentAtivoNotFoundOrForbiddenError) return notFoundResponse('Ativo')
    if (err instanceof InvestmentContaNotFoundOrForbiddenError) return notFoundResponse('Conta')
    if (err instanceof InvestmentValidationError) return errorResponse(err.message, err.statusCode)
    if (err instanceof InvestmentAtivoInactiveError) return errorResponse(err.message, err.statusCode)
    if (err instanceof InvestmentContaCreditError) return errorResponse(err.message, err.statusCode)
    if (err instanceof InvestmentOperacaoInvalidError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
