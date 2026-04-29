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
  atualizarMeta,
  MetaInvalidDateRangeError,
  MetaNotFoundOrForbiddenError,
  obterMeta,
} from '@/server/services/meta.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const meta = await obterMeta(user.id, id)
    return okResponse(meta)
  } catch (err) {
    if (err instanceof MetaNotFoundOrForbiddenError) return notFoundResponse('Meta')
    return serverErrorResponse(err)
  }
}

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

    const meta = await atualizarMeta(user.id, id, body)
    return okResponse(meta)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof MetaNotFoundOrForbiddenError) return notFoundResponse('Meta')
    if (err instanceof MetaInvalidDateRangeError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
