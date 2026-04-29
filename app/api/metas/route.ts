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
  criarMeta,
  listarMetas,
  MetaInvalidDateRangeError,
} from '@/server/services/meta.service'

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const metas = await listarMetas(user.id)
    return okResponse(metas)
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

    const meta = await criarMeta(user.id, body)
    return createdResponse(meta)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof MetaInvalidDateRangeError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
