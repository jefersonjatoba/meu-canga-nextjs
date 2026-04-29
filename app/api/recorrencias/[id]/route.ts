import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  errorResponse,
  getApiUser,
  notFoundResponse,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  CategoriaRecorrenciaNotFoundOrForbiddenError,
  ContaRecorrenciaInvalidaError,
  ContaRecorrenciaNotFoundOrForbiddenError,
  RecorrenciaInvalidDateRangeError,
  RecorrenciaNotFoundOrForbiddenError,
  updateRecorrenciaForUser,
} from '@/server/services/recorrencia.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const recorrencia = await updateRecorrenciaForUser(user.id, id, body)
    return okResponse(recorrencia)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof RecorrenciaNotFoundOrForbiddenError) return notFoundResponse('Recorrencia')
    if (err instanceof ContaRecorrenciaNotFoundOrForbiddenError) return notFoundResponse('Conta')
    if (err instanceof CategoriaRecorrenciaNotFoundOrForbiddenError) return notFoundResponse('Categoria')
    if (err instanceof ContaRecorrenciaInvalidaError) return errorResponse(err.message, err.statusCode)
    if (err instanceof RecorrenciaInvalidDateRangeError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
