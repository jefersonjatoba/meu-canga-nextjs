import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { getApiUser, unauthorizedResponse, okResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/api-auth'
import {
  listAssinaturasForUser,
  createAssinaturaForUser,
  AssinaturaContaNotFoundError,
  AssinaturaContaInvalidaError,
  AssinaturaContaSemConfiguracaoError,
  AssinaturaCategoriaNotFoundError,
} from '@/server/services/assinatura.service'

export async function GET() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const data = await listAssinaturasForUser(user.id)
    return okResponse(data)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const data = await createAssinaturaForUser(user.id, body)
    return createdResponse(data)
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.errors.map(e => e.message).join('; '), 400)
    }
    if (
      err instanceof AssinaturaContaNotFoundError ||
      err instanceof AssinaturaCategoriaNotFoundError
    ) {
      return errorResponse(err.message, 404)
    }
    if (
      err instanceof AssinaturaContaInvalidaError ||
      err instanceof AssinaturaContaSemConfiguracaoError
    ) {
      return errorResponse(err.message, 422)
    }
    return serverErrorResponse(err)
  }
}
