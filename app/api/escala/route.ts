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
  createEscalaSchema,
  escalaFiltersSchema,
} from '@/lib/validations/escala'

// ─── GET /api/escala ──────────────────────────────────────────────────────────
// List the authenticated user's escalas with optional filters.

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsed = escalaFiltersSchema.safeParse(searchParams)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { mes, status, tipoTurno, localServico, page, pageSize } = parsed.data

    // Build WHERE clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { userId: user.id }

    if (mes) {
      const [year, month] = mes.split('-').map(Number)
      // Start of month (UTC midnight)
      const startDate = new Date(Date.UTC(year, month - 1, 1))
      // Start of next month
      const endDate = new Date(Date.UTC(year, month, 1))
      where.dataEscala = { gte: startDate, lt: endDate }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (tipoTurno && tipoTurno !== 'all') {
      where.tipoTurno = tipoTurno
    }

    if (localServico) {
      where.localServico = { contains: localServico, mode: 'insensitive' }
    }

    const [escalas, total] = await Promise.all([
      prisma.escala.findMany({
        where,
        orderBy: { dataEscala: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.escala.count({ where }),
    ])

    return okResponse({
      escalas,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── POST /api/escala ─────────────────────────────────────────────────────────
// Create a new escala. Business rule: no duplicate date per user.

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = createEscalaSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { dataEscala, tipoTurno, localServico } = parsed.data

    // Parse date as a UTC midnight value to avoid timezone drift in DB
    const [year, month, day] = dataEscala.split('-').map(Number)
    const dataEscalaDate = new Date(Date.UTC(year, month - 1, day))

    // Business rule: no 2 agendadas escalas on same date for same user
    const existing = await prisma.escala.findFirst({
      where: {
        userId: user.id,
        dataEscala: dataEscalaDate,
        status: { not: 'cancelada' },
      },
    })

    if (existing) {
      return errorResponse(
        'Já existe uma escala agendada para esta data. Cancele a existente antes de criar uma nova.',
        409
      )
    }

    const escala = await prisma.escala.create({
      data: {
        userId: user.id,
        dataEscala: dataEscalaDate,
        tipoTurno,
        localServico: localServico ?? null,
        status: 'agendada',
      },
    })

    return createdResponse(escala)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
