import {
  getApiUserWithPlan,
  okResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { getActivePlan } from '@/lib/plans'

export async function GET() {
  try {
    const user = await getApiUserWithPlan()
    if (!user) return unauthorizedResponse()

    const plan = getActivePlan(user)

    return okResponse({
      plan:          plan.nome,
      isPro:         plan.nome === 'pro',
      planExpiresAt: user.planExpiresAt,
      limites:       plan.limites,
      recursos:      plan.recursos,
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
