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
  validateMonthlyHours,
} from '@/lib/validations/ras'
import { getRasPrice } from '@/types/ras'
import type { DuracaoRas, GraduacaoRas } from '@/types/ras'

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

    if (competencia) where.competencia = competencia
    if (status && status !== 'all') where.status = status
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

    const {
      data,
      horaInicio,
      horaFim,
      duracao,
      local,
      graduacao,
      tipo,
      tipoVaga,
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
    if (hoursError) return errorResponse(hoursError, 422)

    // ── No duplicate booking same day + start time ────────────────────────────
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
      return errorResponse('Já existe um RAS agendado para esta data e horário.', 409)
    }

    // ── Descanso mínimo de 8h entre RAS ──────────────────────────────────────
    // Calcula o início e fim do novo RAS em minutos absolutos desde meia-noite
    const [newStartH, newStartM] = horaInicio.split(':').map(Number)
    const [newEndH, newEndM] = horaFim.split(':').map(Number)
    const newStartMin = newStartH * 60 + newStartM
    // horaFim pode cruzar meia-noite (ex: 22h + 12h = 10h do dia seguinte)
    const newEndMin = newEndH * 60 + newEndM + (newEndH < newStartH ? 24 * 60 : 0)

    // Janela de busca: dia anterior até dia seguinte (para RAS que cruzam meia-noite)
    const oneDayMs = 24 * 60 * 60 * 1000
    const vizinhos = await prisma.rasAgenda.findMany({
      where: {
        userId: user.id,
        status: { notIn: ['cancelado'] },
        data: {
          gte: new Date(dataDate.getTime() - oneDayMs),
          lte: new Date(dataDate.getTime() + oneDayMs),
        },
      },
      select: { data: true, horaInicio: true, horaFim: true, duracao: true },
    })

    for (const v of vizinhos) {
      const diffDays = Math.round((dataDate.getTime() - v.data.getTime()) / oneDayMs)
      const [vStartH, vStartM] = v.horaInicio.split(':').map(Number)
      const [vEndH, vEndM] = v.horaFim.split(':').map(Number)
      const vStartMin = vStartH * 60 + vStartM + diffDays * 24 * 60
      const vEndMin = vEndH * 60 + vEndM + (vEndH < vStartH ? 24 * 60 : 0) + diffDays * 24 * 60

      const restAfterExisting = newStartMin - vEndMin    // gap: fim do existente → início do novo
      const restAfterNew = vStartMin - newEndMin          // gap: fim do novo → início do existente

      const minRest = 8 * 60 // 8 horas em minutos

      if (
        (restAfterExisting >= 0 && restAfterExisting < minRest) ||
        (restAfterNew >= 0 && restAfterNew < minRest)
      ) {
        return errorResponse(
          `Intervalo mínimo de 8h entre RAS não respeitado. ` +
          `Existe um RAS em ${v.horaInicio}–${v.horaFim} que conflita com o horário solicitado.`,
          422
        )
      }
    }

    // ── Conflito com Escala ───────────────────────────────────────────────────
    // Verifica se há um plantão na Escala que se sobreponha ao novo RAS
    const escalaConflito = await prisma.escala.findFirst({
      where: {
        userId: user.id,
        dataEscala: dataDate,
        status: { not: 'cancelada' },
      },
      select: { horaInicio: true, horaFim: true, tipoTurno: true },
    })

    if (escalaConflito) {
      const [eStartH, eStartM] = escalaConflito.horaInicio.split(':').map(Number)
      const [eEndH, eEndM] = escalaConflito.horaFim.split(':').map(Number)
      const eStartMin = eStartH * 60 + eStartM
      const eEndMin = eEndH * 60 + eEndM + (eEndH < eStartH ? 24 * 60 : 0)

      // Sobreposição: novo RAS começa antes do fim da escala E termina depois do início
      const overlap =
        newStartMin < eEndMin && newEndMin > eStartMin

      if (overlap) {
        return errorResponse(
          `Conflito com plantão na Escala: ${escalaConflito.tipoTurno} ` +
          `(${escalaConflito.horaInicio}–${escalaConflito.horaFim}). ` +
          `Verifique sua escala antes de agendar o RAS.`,
          409
        )
      }
    }

    // ── Auto-status: evento no passado → confirmado, futuro → agendado ────────
    const nowBR = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    )
    const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`
    const autoStatus = data < todayStr ? 'confirmado' : 'agendado'

    const valorCentavos = getRasPrice(graduacao as GraduacaoRas, duracao as DuracaoRas)

    const rasAgenda = await prisma.rasAgenda.create({
      data: {
        userId: user.id,
        data: dataDate,
        horaInicio,
        horaFim,
        duracao,
        local,
        graduacao,
        tipo,
        tipoVaga,
        valorCentavos,
        competencia,
        observacoes: observacoes ?? null,
        status: autoStatus,
      },
      include: { agendamentos: true, pagamentos: true },
    })

    return createdResponse(rasAgenda)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
