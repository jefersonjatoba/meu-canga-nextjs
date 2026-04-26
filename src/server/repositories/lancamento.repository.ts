// Lancamento Repository — sole Prisma access point for lançamentos.
// Rules:
//   1. Every query filters by userId — never return another user's data.
//   2. update/delete use updateMany/deleteMany so count=0 signals unauthorized access.
//   3. No business logic, no formatting, no Zod schemas here.

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { CreateLancamentoSchema, UpdateLancamentoSchema, LancamentoFiltersSchema } from '@/features/lancamentos/schemas'

// ─── Conta select shape included in most queries ──────────────────────────────

const contaSelect = { select: { id: true, nome: true, tipo: true } } as const

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createLancamento(
  userId: string,
  data: CreateLancamentoSchema & { competenciaAt: string },
) {
  return prisma.lancamento.create({
    data: {
      userId,
      contaId:       data.contaId,
      descricao:     data.descricao,
      tipo:          data.tipo,
      categoria:     data.categoria,
      valorCentavos: data.valorCentavos,
      data:          parseUTCDate(data.data),
      competenciaAt: data.competenciaAt,
      source:        data.source,
      status:        data.status,
      metaJson:      toJsonInput(data.metaJson),
    },
    include: { conta: contaSelect },
  })
}

// ─── Update ───────────────────────────────────────────────────────────────────
// Returns { count }. count=0 means record not found or belongs to another user.

export async function updateLancamento(
  userId: string,
  id: string,
  data: UpdateLancamentoSchema,
) {
  return prisma.lancamento.updateMany({
    where: { id, userId },
    data: {
      descricao:     data.descricao,
      tipo:          data.tipo,
      categoria:     data.categoria,
      valorCentavos: data.valorCentavos,
      data:          data.data ? parseUTCDate(data.data) : undefined,
      competenciaAt: data.competenciaAt,
      status:        data.status,
      metaJson:      data.metaJson !== undefined ? toJsonInput(data.metaJson) : undefined,
    },
  })
}

// ─── Delete ───────────────────────────────────────────────────────────────────
// Hard delete. Returns { count }. count=0 means not found or forbidden.

export async function deleteLancamento(userId: string, id: string) {
  return prisma.lancamento.deleteMany({ where: { id, userId } })
}

// ─── Find by ID ───────────────────────────────────────────────────────────────

export async function findLancamentoById(userId: string, id: string) {
  return prisma.lancamento.findFirst({
    where: { id, userId },
    include: { conta: contaSelect },
  })
}

// ─── List with filters & pagination ─────────────────────────────────────────

export async function listLancamentosByUser(
  userId: string,
  filters: LancamentoFiltersSchema,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId }

  if (filters.mes)                           where.competenciaAt = filters.mes
  if (filters.tipo && filters.tipo !== 'all') where.tipo = filters.tipo
  if (filters.contaId)                       where.contaId = filters.contaId
  if (filters.categoria)                     where.categoria = { contains: filters.categoria, mode: 'insensitive' }
  if (filters.status && filters.status !== 'all') where.status = filters.status

  const skip = (filters.page - 1) * filters.pageSize

  const [items, total] = await prisma.$transaction([
    prisma.lancamento.findMany({
      where,
      include: { conta: contaSelect },
      orderBy: { data: 'desc' },
      skip,
      take: filters.pageSize,
    }),
    prisma.lancamento.count({ where }),
  ])

  return {
    items,
    total,
    page:       filters.page,
    pageSize:   filters.pageSize,
    totalPages: Math.ceil(total / filters.pageSize),
  }
}

// ─── List by month (no pagination — used internally) ─────────────────────────

export async function listLancamentosByMonth(userId: string, mes: string) {
  return prisma.lancamento.findMany({
    where:    { userId, competenciaAt: mes },
    orderBy:  { data: 'asc' },
  })
}

// ─── Financial snapshot — only confirmed, minimal columns ────────────────────
// Used by finance.engine.ts to compute totals. No conta join needed.

export async function getLancamentosForFinancialSnapshot(userId: string, mes: string) {
  return prisma.lancamento.findMany({
    where:  { userId, competenciaAt: mes, status: 'confirmada' },
    select: { valorCentavos: true, tipo: true, metaJson: true },
  })
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

// Prisma's InputJsonValue and Record<string, unknown> are not directly assignable
// in TypeScript's structural type system. This cast is safe at runtime.
function toJsonInput(
  v: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (v == null) return Prisma.JsonNull
  return v as unknown as Prisma.InputJsonValue
}
