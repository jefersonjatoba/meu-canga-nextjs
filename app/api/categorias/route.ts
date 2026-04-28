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
  CategoriaAlreadyExistsError,
  createCategoriaForUser,
  firstZodMessage,
  listCategoriasForUser,
} from '@/server/services/categoria.service'

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    const categorias = await listCategoriasForUser(user.id, params)
    return okResponse(categorias)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const categoria = await createCategoriaForUser(user.id, body)
    return createdResponse(categoria)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof CategoriaAlreadyExistsError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}
