import type { NextRequest } from 'next/server'
import {
  errorResponse,
  getApiUser,
  notFoundResponse,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  cancelarAporte,
  MetaAporteInvalidStateError,
  MetaAporteNotFoundOrForbiddenError,
  MetaNotFoundOrForbiddenError,
} from '@/server/services/meta.service'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; aporteId: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id, aporteId } = await params
    const meta = await cancelarAporte(user.id, id, aporteId)
    return okResponse(meta)
  } catch (err) {
    if (err instanceof MetaNotFoundOrForbiddenError) return notFoundResponse('Meta')
    if (err instanceof MetaAporteNotFoundOrForbiddenError) return notFoundResponse('Aporte')
    if (err instanceof MetaAporteInvalidStateError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}
