import type { NextRequest } from 'next/server'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  cancelarCompraCartao,
  CompraCartaoInvalidStateError,
  CompraCartaoNotFoundOrForbiddenError,
  FaturaCartaoInvalidStateError,
} from '@/server/services/cartao.service'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const compra = await cancelarCompraCartao(user.id, id)
    return createdResponse(compra)
  } catch (err) {
    if (err instanceof CompraCartaoNotFoundOrForbiddenError) return notFoundResponse('Compra')
    if (err instanceof CompraCartaoInvalidStateError) return errorResponse(err.message, err.statusCode)
    if (err instanceof FaturaCartaoInvalidStateError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}
