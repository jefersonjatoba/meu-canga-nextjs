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
  MetaInvalidStateError,
  MetaNotFoundOrForbiddenError,
  toggleMeta,
} from '@/server/services/meta.service'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const meta = await toggleMeta(user.id, id)
    return okResponse(meta)
  } catch (err) {
    if (err instanceof MetaNotFoundOrForbiddenError) return notFoundResponse('Meta')
    if (err instanceof MetaInvalidStateError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}
