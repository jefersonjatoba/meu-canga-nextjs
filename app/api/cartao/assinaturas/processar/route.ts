import { getApiUser, unauthorizedResponse, okResponse, serverErrorResponse } from '@/lib/api-auth'
import { processarAssinaturas } from '@/server/services/assinatura.service'

export async function POST() {
  const user = await getApiUser()
  if (!user) return unauthorizedResponse()

  try {
    const result = await processarAssinaturas(user.id)
    return okResponse(result)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
