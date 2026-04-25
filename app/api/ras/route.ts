import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  okResponse,
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import {
  createRasAgendaSchema,
  rasAgendaFiltersSchema,
  validateMonthlyHours,
} from '@/lib/validations/ras'
import { getRasPrice } from '@/types/ras'
import type { DuracaoRas, GraduacaoRas } from '@/types/ras'

// ─── GET /api/ras ─────────────────────────────────────────────────────────────
// List the authenticated user's RAS agendas with optional filters.

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = rasAgendaFiltersSchema.safeParse(searchParams)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { competencia, status, graduacao, local, page, pageSize } = parsed.data

    // Build WHERE clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { userId: user.id }

    if (competencia) {
      where.competencia = competencia
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (graduacao && graduacao !== 'all') {
      where.graduacao = graduacao
    }

    if (local) {
      where.local = { contains: local, mode: 'insensitive' }
    }

    const [rasAgendas, total] = await Promise.all([
      prisma.rasAgenda.findMany({
        where,
        orderBy: { data: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          agendamentos: true,
          pagamentos: true,
        },
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
// Create a new RAS agenda entry.

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper auth - temporarily disabled for testing
    const user = { id: '1', email: 'user@example.com', name: 'Test User', role: 'user' }
    // const user = await getApiUser()
    // if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = createRasAgendaSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const {
      data,
      horaInicio,
      horaFim,
      duracao,
      local,
      graduacao,
      competencia,
      observacoes,
    } = parsed.data

    // ── Monthly hours limit check ─────────────────────────────────────────────
    const existingHoursResult = await prisma.rasAgenda.aggregate({
      where: {
        userId: user.id,
        competencia,
        status: { notIn: ['cancelado'] },
      },
      _sum: { duracao: true },
    })

    const currentHours = existingHoursResult._sum.duracao ?? 0
    const hoursError = validateMonthlyHours(currentHours, duracao)
    if (hoursError) {
      return errorResponse(hoursError, 422)
    }

    // ── No duplicate booking on same day + start time ─────────────────────────
    const [year, month, day] = data.split('-').map(Number)
    const dataDate = new Date(Date.UTC(year, month - 1, day))

    const existing = await prisma.rasAgenda.findFirst({
      where: {
        userId: user.id,
        data: dataDate,
        horaInicio,
        status: { notIn: ['cancelado'] },
      },
    })

    if (existing) {
      return errorResponse(
        'Já existe um RAS agendado para esta data e horário.',
        409
      )
    }

    // ── Compute price from table at creation time ────────────────────────────
    const valorCentavos = getRasPrice(
      graduacao as GraduacaoRas,
      duracao as DuracaoRas
    )

    const rasAgenda = await prisma.rasAgenda.create({
      data: {
        userId: user.id,
        data: dataDate,
        horaInicio,
        horaFim,
        duracao,
        local,
        graduacao,
        valorCentavos,
        competencia,
        observacoes: observacoes ?? null,
        status: 'agendado',
      },
      include: {
        agendamentos: true,
        pagamentos: true,
      },
    })

    return createdResponse(rasAgenda)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
