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
import {
  createRasAgendaSchema,
  rasAgendaFiltersSchema,
} from '@/lib/validations/ras'
import * as rasService from '@/server/services/ras.service'
import { RasDomainError, RasErrorCode } from '@/lib/ras-errors'
import { Prisma } from '@/server/repositories/ras.repository'

// ─── Helper: map RasDomainError → HTTP status ─────────────────────────────────

function domainErrorResponse(err: RasDomainError) {
  const { code, message } = err.response
  switch (code) {
    case RasErrorCode.DUPLICATE_RAS:
      return errorResponse(message, 409)
    case RasErrorCode.MONTHLY_HOURS_EXCEEDED:
      return errorResponse(message, 422)
    case RasErrorCode.MIN_REST_VIOLATED:
      return errorResponse(message, 422)
    case RasErrorCode.ESCALA_CONFLICT:
      return errorResponse(message, 409)
    case RasErrorCode.NOT_FOUND:
      return errorResponse(message, 404)
    case RasErrorCode.FORBIDDEN:
      return errorResponse(message, 403)
    case RasErrorCode.TRANSITION_INVALID:
      return errorResponse(message, 422)
    default:
      return errorResponse(message, 400)
  }
}

// ─── GET /api/ras ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    // Transição automática realizado→pendente para RAS com expiresAt vencido
    await prisma.rasAgenda.updateMany({
      where: {
        userId: user.id,
        status: 'realizado',
        expiresAt: { lte: new Date() },
      },
      data: { status: 'pendente' },
    })

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = rasAgendaFiltersSchema.safeParse(searchParams)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { competencia, status, graduacao, local, page, pageSize } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { userId: user.id }

    // Filtro de soft-delete: para cancelados, mostrar registros deletados (tanto com status='cancelado' quanto com deletadoEm IS NOT NULL)
    if (status && status !== 'all' && status === 'cancelado') {
      // Mostrar registros com status='cancelado' OU deletadoEm IS NOT NULL (para compatibilidade com RAS cancelados antes da mudança)
      where.OR = [
        { status: 'cancelado' },
        { deletadoEm: { not: null } },
      ]
    } else {
      // Para outros status, mostrar apenas registros ativos (deletadoEm IS NULL)
      where.deletadoEm = null
    }

    if (competencia) where.competencia = competencia
    if (status && status !== 'all' && status !== 'cancelado') where.status = status
    if (graduacao && graduacao !== 'all') where.graduacao = graduacao
    if (local) where.local = { contains: local, mode: 'insensitive' }

    const [rasAgendas, total] = await Promise.all([
      prisma.rasAgenda.findMany({
        where,
        orderBy: { data: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { agendamentos: true, pagamentos: true },
      }),
      prisma.rasAgenda.count({ where }),
    ])

    return okResponse({
      rasAgendas,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── POST /api/ras ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = createRasAgendaSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    // criarRasAgendado aplica todas as regras de negócio:
    //   - Checagem de duplicata (FIX-8: explicit check + unique constraint fallback)
    //   - Limite mensal de horas
    //   - Descanso mínimo de 8h com timestamps absolutos (FIX-6)
    //   - Conflito com Escala via escalaRepo (FIX-3)
    //   - Auto-status: data passada → 'realizado', futuro/hoje → 'agendado' (FIX-2)
    try {
      const { ras } = await rasService.criarRasAgendado(user.id, parsed.data)
      return createdResponse(ras)
    } catch (err) {
      if (err instanceof RasDomainError) {
        return domainErrorResponse(err)
      }

      // FIX-8: Race condition — unique constraint violation (P2002)
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return errorResponse('Já existe um RAS agendado para esta data e horário.', 409)
      }

      throw err  // re-throw for outer serverErrorResponse
    }
  } catch (err) {
    return serverErrorResponse(err)
  }
}
