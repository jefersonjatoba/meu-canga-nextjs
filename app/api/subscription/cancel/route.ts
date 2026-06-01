import { getApiUser, unauthorizedResponse, okResponse, serverErrorResponse } from '@/lib/api-auth'
import { cancelPro } from '@/server/services/plan.service'

export async function POST() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    await cancelPro(user.id, 'cancelamento_voluntario')

    return okResponse({ cancelled: true })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
