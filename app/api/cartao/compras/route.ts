import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  CategoriaCartaoNotFoundOrForbiddenError,
  ContaCartaoInvalidaError,
  ContaCartaoNotFoundOrForbiddenError,
  ContaCartaoSemConfiguracaoError,
  criarCompraCartao,
} from '@/server/services/cartao.service'

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const compra = await criarCompraCartao(user.id, body)
    return createdResponse(compra)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof ContaCartaoNotFoundOrForbiddenError) return errorResponse(err.message, 404)
    if (err instanceof CategoriaCartaoNotFoundOrForbiddenError) return errorResponse(err.message, 404)
    if (err instanceof ContaCartaoInvalidaError) return errorResponse(err.message, err.statusCode)
    if (err instanceof ContaCartaoSemConfiguracaoError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
