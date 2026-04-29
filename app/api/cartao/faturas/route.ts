import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  errorResponse,
  getApiUser,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import { listarFaturas } from '@/server/services/cartao.service'

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const faturas = await listarFaturas(user.id, params)
    return okResponse(faturas)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
