import {
  getApiUser,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import { processarRecorrencias } from '@/server/services/recorrencia.service'

export async function POST() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const result = await processarRecorrencias(user.id)
    return okResponse(result)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
