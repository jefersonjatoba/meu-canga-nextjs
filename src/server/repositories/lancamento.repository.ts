// Lancamento Repository — sole Prisma access point for lançamentos.
// Rules:
//   1. Every query filters by userId — never return another user's data.
//   2. update/delete use updateMany/deleteMany so count=0 signals unauthorized access.
//   3. Soft delete: deletadoEm = null means active. Hard deletes are forbidden.
//   4. Every mutation writes a LancamentoAuditLog inside the same transaction.
//   5. No business logic, no formatting, no Zod schemas here.

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { CreateLancamentoSchema, UpdateLancamentoSchema, LancamentoFiltersSchema } from '@/features/lancamentos/schemas'

// ─── Conta select shape included in most queries ──────────────────────────────

const contaSelect = { select: { id: true, nome: true, tipo: true } } as const
const categoriaSelect = { select: { id: true, nome: true, tipo: true } } as const

// ─── Active-only filter (soft delete) ────────────────────────────────────────

const ATIVO = { deletadoEm: null } as const

// ─── Create ───────────────────────────────────────────────────────────────────
// Idempotency: if idempotencyKey already exists, returns the existing record
// instead of creating a duplicate (Stripe-style double-submit protection).

export async function createLancamento(
  userId: string,
  data: CreateLancamentoSchema & { competenciaAt: string; idempotencyKey?: string },
  ipAddress?: string,
) {
  // Fast-path: if key provided, check for existing record first
  if (data.idempotencyKey) {
    const existing = await prisma.lancamento.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
      include: { conta: contaSelect, categoriaRef: categoriaSelect },
    })
    if (existing) return existing
  }

  const lancamento = await prisma.$transaction(async (tx) => {
    const created = await tx.lancamento.create({
      data: {
        userId,
        contaId:        data.contaId,
        categoriaId:    data.categoriaId,
        descricao:      data.descricao,
        tipo:           data.tipo,
        categoria:      data.categoria,
        valorCentavos:  data.valorCentavos,
        data:           parseUTCDate(data.data),
        competenciaAt:  data.competenciaAt,
        source:         data.source,
        status:         data.status,
        metaJson:       toJsonInput(data.metaJson),
        idempotencyKey: data.idempotencyKey ?? null,
      },
      include: { conta: contaSelect, categoriaRef: categoriaSelect },
    })

    await tx.lancamentoAuditLog.create({
      data: {
        userId,
        lancamentoId: created.id,
        acao:         'criado',
        dadosDepois:  toJsonInput(serializeLancamento(created)),
        ipAddress:    ipAddress ?? null,
      },
    })

    return created
  })

  return lancamento
}

// ─── Update ───────────────────────────────────────────────────────────────────
// Returns { count }. count=0 means record not found or belongs to another user.

export async function updateLancamento(
  userId: string,
  id: string,
  data: UpdateLancamentoSchema,
  ipAddress?: string,
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.lancamento.findFirst({
      where: { id, userId, ...ATIVO },
    })
    if (!before) return { count: 0 }

    const result = await tx.lancamento.updateMany({
      where: { id, userId, ...ATIVO },
      data: {
        descricao:     data.descricao,
        tipo:          data.tipo,
        categoriaId:   data.categoriaId,
        categoria:     data.categoria,
        valorCentavos: data.valorCentavos,
        data:          data.data ? parseUTCDate(data.data) : undefined,
        competenciaAt: data.competenciaAt,
        status:        data.status,
        metaJson:      data.metaJson !== undefined ? toJsonInput(data.metaJson) : undefined,
      },
    })

    if (result.count > 0) {
      await tx.lancamentoAuditLog.create({
        data: {
          userId,
          lancamentoId: id,
          acao:         'atualizado',
          dadosAntes:   toJsonInput(serializeLancamento(before)),
          dadosDepois:  toJsonInput(data as Record<string, unknown>),
          ipAddress:    ipAddress ?? null,
        },
      })
    }

    return result
  })
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────
// Sets deletadoEm = now(). Data is never physically removed.
// Returns { count }. count=0 means not found or forbidden.

export async function deleteLancamento(userId: string, id: string, ipAddress?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.lancamento.findFirst({
      where: { id, userId, ...ATIVO },
    })
    if (!before) return { count: 0 }

    const result = await tx.lancamento.updateMany({
      where: { id, userId, ...ATIVO },
      data: { deletadoEm: new Date() },
    })

    if (result.count > 0) {
      await tx.lancamentoAuditLog.create({
        data: {
          userId,
          lancamentoId: id,
          acao:         'deletado',
          dadosAntes:   toJsonInput(serializeLancamento(before)),
          ipAddress:    ipAddress ?? null,
        },
      })
    }

    return result
  })
}

// ─── Find by ID ───────────────────────────────────────────────────────────────

export async function findLancamentoById(userId: string, id: string) {
  return prisma.lancamento.findFirst({
    where: { id, userId, ...ATIVO },
    include: { conta: contaSelect, categoriaRef: categoriaSelect },
  })
}

// ─── List with filters & pagination ─────────────────────────────────────────

export async function listLancamentosByUser(
  userId: string,
  filters: LancamentoFiltersSchema,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId, ...ATIVO }

  if (filters.mes)                             where.competenciaAt = filters.mes
  if (filters.tipo && filters.tipo !== 'all')  where.tipo = filters.tipo
  if (filters.contaId)                         where.contaId = filters.contaId
  if (filters.categoria)                       where.categoria = { contains: filters.categoria, mode: 'insensitive' }
  if (filters.status && filters.status !== 'all') where.status = filters.status

  const skip = (filters.page - 1) * filters.pageSize

  const [items, total] = await prisma.$transaction([
    prisma.lancamento.findMany({
      where,
      include: { conta: contaSelect, categoriaRef: categoriaSelect },
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
    where:   { userId, competenciaAt: mes, ...ATIVO },
    orderBy: { data: 'asc' },
  })
}

// ─── Financial snapshot — only confirmed, minimal columns ────────────────────
// Used by finance.engine.ts to compute totals. No conta join needed.

export async function getLancamentosForFinancialSnapshot(userId: string, mes: string) {
  return prisma.lancamento.findMany({
    where:  { userId, competenciaAt: mes, status: 'confirmada', ...ATIVO },
    select: { valorCentavos: true, tipo: true, metaJson: true },
  })
}

// ─── Patrimônio investido acumulado (histórico completo) ──────────────────────
// Soma todos os aportes e resgates confirmados — sem filtro por mês.

export async function getPatrimonioInvestidoAcumulado(userId: string): Promise<{ totalAportes: number; totalResgates: number }> {
  const rows = await prisma.lancamento.groupBy({
    by: ['tipo'],
    where: {
      userId,
      tipo:      { in: ['investment_aporte', 'investment_resgate'] },
      status:    'confirmada',
      ...ATIVO,
    },
    _sum: { valorCentavos: true },
  })
  const totalAportes  = rows.find(r => r.tipo === 'investment_aporte')?._sum.valorCentavos  ?? 0
  const totalResgates = rows.find(r => r.tipo === 'investment_resgate')?._sum.valorCentavos ?? 0
  return { totalAportes, totalResgates }
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

// Snapshot lancamento fields for audit log (exclude large/relational fields)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeLancamento(l: Record<string, any>): Record<string, unknown> {
  return {
    id:            l.id,
    contaId:       l.contaId,
    descricao:     l.descricao,
    tipo:          l.tipo,
    categoria:     l.categoria,
    valorCentavos: l.valorCentavos,
    data:          l.data instanceof Date ? l.data.toISOString() : l.data,
    competenciaAt: l.competenciaAt,
    status:        l.status,
    source:        l.source,
  }
}
