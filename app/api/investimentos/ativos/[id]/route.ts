import type { NextRequest } from 'next/server'

import {
  getApiUser,
  notFoundResponse,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  InvestmentAtivoNotFoundOrForbiddenError,
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
