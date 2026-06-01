import type { NextRequest } from 'next/server'

import {
  errorResponse,
  getApiUser,
  notFoundResponse,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  InvestmentAtivoComOperacoesAtivasError,
  InvestmentAtivoNotFoundOrForbiddenError,
  excluirAtivo,
  obterAtivoComPosicao,
} from '@/server/services/investment.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const ativo = await obterAtivoComPosicao(user.id, id)
    return okResponse(ativo)
  } catch (err) {
    if (err instanceof InvestmentAtivoNotFoundOrForbiddenError) return notFoundResponse('Ativo')
    return serverErrorResponse(err)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    await excluirAtivo(user.id, id)
    return okResponse({ deleted: true })
  } catch (err) {
    if (err instanceof InvestmentAtivoNotFoundOrForbiddenError) return notFoundResponse('Ativo')
    if (err instanceof InvestmentAtivoComOperacoesAtivasError) return errorResponse(err.message, 422)
    return serverErrorResponse(err)
  }
}
