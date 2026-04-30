import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'

import { cancelarOperacaoSchema } from '@/features/investimentos/schemas'
import {
  errorResponse,
  getApiUser,
  notFoundResponse,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  InvestmentOperacaoInvalidStateError,
  InvestmentOperacaoNotFoundOrForbiddenError,
  InvestmentValidationError,
  cancelarOperacao,
} from '@/server/services/investment.service'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = cancelarOperacaoSchema.parse(await params)
    const ativo = await cancelarOperacao(user.id, id)
    return okResponse(ativo)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof InvestmentOperacaoNotFoundOrForbiddenError) return notFoundResponse('Operacao')
    if (err instanceof InvestmentValidationError) return errorResponse(err.message, err.statusCode)
    if (err instanceof InvestmentOperacaoInvalidStateError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
