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
  CategoriaAlreadyExistsError,
  CategoriaNotFoundOrForbiddenError,
  firstZodMessage,
  updateCategoriaForUser,
} from '@/server/services/categoria.service'

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

    const categoria = await updateCategoriaForUser(user.id, id, body)
    return okResponse(categoria)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof CategoriaAlreadyExistsError) return errorResponse(err.message, err.statusCode)
    if (err instanceof CategoriaNotFoundOrForbiddenError) return notFoundResponse('Categoria')
    return serverErrorResponse(err)
  }
}
