import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import { ZodError } from 'zod'

// GET /api/dashboard/summary?mes=2026-04

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const mes = request.nextUrl.searchParams.get('mes') ?? undefined
    const data = await getDashboardSummaryForUser(user.id, { mes })

    return okResponse(data)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(err.errors[0].message)
    return serverErrorResponse(err)
  }
}
