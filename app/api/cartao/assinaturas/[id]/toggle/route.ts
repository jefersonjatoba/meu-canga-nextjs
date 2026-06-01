import { getApiUser, unauthorizedResponse, okResponse, errorResponse, serverErrorResponse } from '@/lib/api-auth'
import { toggleAssinaturaForUser, AssinaturaNotFoundOrForbiddenError } from '@/server/services/assinatura.service'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const data = await toggleAssinaturaForUser(user.id, id)
    return okResponse(data)
  } catch (err) {
    if (err instanceof AssinaturaNotFoundOrForbiddenError) {
      return errorResponse(err.message, 404)
    }
    return serverErrorResponse(err)
  }
}
