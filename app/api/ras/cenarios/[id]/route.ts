import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'

// ─── GET /api/ras/cenarios/[id] ───────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const cenario = await prisma.rasCenarioSalvo.findUnique({ where: { id } })
    if (!cenario) return notFoundResponse('Cenário')
    if (cenario.userId !== user.id) return forbiddenResponse()

    return okResponse(cenario)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── DELETE /api/ras/cenarios/[id] ───────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const cenario = await prisma.rasCenarioSalvo.findUnique({ where: { id } })
    if (!cenario) return notFoundResponse('Cenário')
    if (cenario.userId !== user.id) return forbiddenResponse()

    await prisma.rasCenarioSalvo.delete({ where: { id } })
    return okResponse({ deleted: true })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
