import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  ContaMetaInvalidaError,
  ContaMetaNotFoundOrForbiddenError,
  MetaInvalidStateError,
  MetaNotFoundOrForbiddenError,
  registrarAporte,
} from '@/server/services/meta.service'

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

    const meta = await registrarAporte(user.id, id, body)
    return createdResponse(meta)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof MetaNotFoundOrForbiddenError) return notFoundResponse('Meta')
    if (err instanceof ContaMetaNotFoundOrForbiddenError) return notFoundResponse('Conta')
    if (err instanceof ContaMetaInvalidaError) return errorResponse(err.message, err.statusCode)
    if (err instanceof MetaInvalidStateError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
