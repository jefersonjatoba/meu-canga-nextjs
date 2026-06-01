import { z, ZodError } from 'zod'
import {
  errorResponse,
  forbiddenResponse,
  getApiUserWithPlan,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import { getActivePlan, canUseRecurso } from '@/lib/plans'
import { AssistenteIaError, createFinancialAssistantStream, isAnthropicConfigured } from '@/server/services/assistente.service'

export const runtime = 'nodejs'

const bodySchema = z.object({
  message: z.string().trim().min(2).max(4000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2000),
  })).max(12).default([]),
  mes: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getApiUserWithPlan()
    if (!user) return unauthorizedResponse()

    const plan = getActivePlan(user)
    if (!canUseRecurso(plan, 'agente_ia')) return forbiddenResponse()

    if (!isAnthropicConfigured()) {
      return errorResponse('Agente IA indisponível neste ambiente. Configure ANTHROPIC_API_KEY.', 503)
    }

    const body = bodySchema.parse(await request.json())
    const stream = await createFinancialAssistantStream({
      userId: user.id,
      userName: user.name,
      message: body.message,
      history: body.history,
      mes: body.mes,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.errors[0]?.message ?? 'Payload inválido')
    }
    if (err instanceof AssistenteIaError) {
      return errorResponse(err.message, err.statusCode)
    }
    return serverErrorResponse(err)
  }
}
