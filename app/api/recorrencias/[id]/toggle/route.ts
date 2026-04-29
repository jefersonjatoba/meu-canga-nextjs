import type { NextRequest } from 'next/server'
import {
  getApiUser,
  notFoundResponse,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  RecorrenciaNotFoundOrForbiddenError,
  toggleRecorrenciaForUser,
} from '@/server/services/recorrencia.service'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const recorrencia = await toggleRecorrenciaForUser(user.id, id)
    return okResponse(recorrencia)
  } catch (err) {
    if (err instanceof RecorrenciaNotFoundOrForbiddenError) return notFoundResponse('Recorrencia')
    return serverErrorResponse(err)
  }
}
