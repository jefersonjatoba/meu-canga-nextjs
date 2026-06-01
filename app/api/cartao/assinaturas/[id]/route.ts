import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { getApiUser, unauthorizedResponse, okResponse, errorResponse, serverErrorResponse } from '@/lib/api-auth'
import {
  updateAssinaturaForUser,
  AssinaturaNotFoundOrForbiddenError,
  AssinaturaContaInvalidaError,
  AssinaturaContaSemConfiguracaoError,
  AssinaturaCategoriaNotFoundError,
} from '@/server/services/assinatura.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()
    const data = await updateAssinaturaForUser(user.id, id, body)
    return okResponse(data)
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.errors.map(e => e.message).join('; '), 400)
    }
    if (err instanceof AssinaturaNotFoundOrForbiddenError) {
      return errorResponse(err.message, 404)
    }
    if (err instanceof AssinaturaCategoriaNotFoundError) {
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
