import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import * as rasService from '@/server/services/ras.service'

// ─── GET /api/ras/audit-logs ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50')

    if (page < 1 || pageSize < 1 || pageSize > 500) {
      return errorResponse('Parâmetros de paginação inválidos')
    }

    const offset = (page - 1) * pageSize
    const { logs, total } = await rasService.findAuditLogsByUser(
      user.id,
      pageSize,
      offset
    )

    return okResponse({
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
