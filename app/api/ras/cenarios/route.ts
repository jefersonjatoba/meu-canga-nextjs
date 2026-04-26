import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { createRasCenarioSchema } from '@/lib/validations/ras'
import { getRasPrice } from '@/types/ras'
import type { GraduacaoRas, DuracaoRas } from '@/types/ras'

// ─── GET /api/ras/cenarios ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const mes = request.nextUrl.searchParams.get('mes') ?? undefined

    const cenarios = await prisma.rasCenarioSalvo.findMany({
      where: {
        userId: user.id,
        ...(mes ? { mes } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return okResponse(cenarios)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── POST /api/ras/cenarios ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = createRasCenarioSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { nome, descricao, mes, graduacao, eventos } = parsed.data

    const totalHoras = eventos.reduce((sum, e) => sum + e.duracao, 0)
    const totalCentavos = eventos.reduce(
      (sum, e) => sum + getRasPrice(graduacao as GraduacaoRas, e.duracao as DuracaoRas),
      0
    )

    const cenario = await prisma.rasCenarioSalvo.create({
      data: {
        userId: user.id,
        nome,
        descricao: descricao ?? null,
        mes,
        graduacao,
        eventos,
        totalHoras,
        totalCentavos,
      },
    })

    return createdResponse(cenario)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
