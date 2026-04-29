import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api-auth'
import {
  FaturaCartaoNotFoundOrForbiddenError,
  obterFatura,
} from '@/server/services/cartao.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const fatura = await obterFatura(user.id, id)
    return okResponse(fatura)
  } catch (err) {
    if (err instanceof FaturaCartaoNotFoundOrForbiddenError) return notFoundResponse('Fatura')
    return serverErrorResponse(err)
  }
}
