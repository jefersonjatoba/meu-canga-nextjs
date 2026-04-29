import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  CategoriaRecorrenciaNotFoundOrForbiddenError,
  ContaRecorrenciaInvalidaError,
  ContaRecorrenciaNotFoundOrForbiddenError,
  RecorrenciaInvalidDateRangeError,
  createRecorrenciaForUser,
  listRecorrenciasForUser,
} from '@/server/services/recorrencia.service'

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const recorrencias = await listRecorrenciasForUser(user.id)
    return okResponse(recorrencias)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const recorrencia = await createRecorrenciaForUser(user.id, body)
    return createdResponse(recorrencia)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof ContaRecorrenciaNotFoundOrForbiddenError) return errorResponse(err.message, err.statusCode)
    if (err instanceof ContaRecorrenciaInvalidaError) return errorResponse(err.message, err.statusCode)
    if (err instanceof CategoriaRecorrenciaNotFoundOrForbiddenError) return errorResponse(err.message, err.statusCode)
    if (err instanceof RecorrenciaInvalidDateRangeError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
