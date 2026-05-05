// RAS Repository — sole Prisma access point for rasAgenda records.
// Rules:
//   1. Every query filters by userId — never return another user's data.
//   2. update/delete use updateMany/deleteMany so count=0 signals unauthorized access.
//   3. No business logic, no formatting — pure data access only.

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { RasAgenda, StatusRas, DuracaoRas, CreateRasAgendaInput } from '@/types/ras'
import { getRasPrice } from '@/types/ras'

// Re-export so callers can catch constraint violations without importing Prisma directly.
export { Prisma }

// ─── Soft Delete Filter ────────────────────────────────────────────────────────
// CRITICAL: Always filter deletadoEm IS NULL in user-facing queries
// This is essential for 10k clients / 1M records to keep queries fast with indexes
const ACTIVE_FILTER = { deletadoEm: null } as const

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DD" to a UTC Date (midnight). */
function parseUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Build the start/end Date range for an entire "YYYY-MM" month. */
function monthRange(competencia: string): { gte: Date; lte: Date } {
  const [year, month] = competencia.split('-').map(Number)
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  }
}

/** Prisma select for relations included in most queries. */
const withRelations = {
  include: {
    agendamentos: true,
    pagamentos:   true,
  },
} as const

/** Map a raw Prisma RasAgenda row (with relations) to the domain RasAgenda type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): RasAgenda {
  return {
    id:            row.id,
    userId:        row.userId,
    data:          row.data instanceof Date
                     ? row.data.toISOString().slice(0, 10)
                     : String(row.data).slice(0, 10),
    horaInicio:    row.horaInicio,
    horaFim:       row.horaFim,
    duracao:       row.duracao as DuracaoRas,
    local:         row.local,
    graduacao:     row.graduacao,
    tipo:          row.tipo,
    tipoVaga:      row.tipoVaga,
    valorCentavos: row.valorCentavos,
    status:        row.status as StatusRas,
    competencia:   row.competencia,
    observacoes:   row.observacoes ?? null,
    expiresAt:     row.expiresAt instanceof Date
                     ? row.expiresAt.toISOString()
                     : (row.expiresAt ?? null),
    createdAt:     row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt:     row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    agendamentos:  row.agendamentos?.map((a: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
      id:             a.id,
      rasAgendaId:    a.rasAgendaId,
      userId:         a.userId,
      status:         a.status as StatusRas,
      dataRealizacao: a.dataRealizacao instanceof Date ? a.dataRealizacao.toISOString() : (a.dataRealizacao ?? null),
      observacoes:    a.observacoes ?? null,
      createdAt:      a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
      updatedAt:      a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
    })),
    pagamentos:    row.pagamentos?.map((p: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
      id:             p.id,
      rasAgendaId:    p.rasAgendaId,
      userId:         p.userId,
      valorCentavos:  p.valorCentavos,
      competencia:    p.competencia,
      dataPagamento:  p.dataPagamento instanceof Date ? p.dataPagamento.toISOString() : (p.dataPagamento ?? null),
      comprovante:    p.comprovante ?? null,
      observacoes:    p.observacoes ?? null,
      createdAt:      p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      updatedAt:      p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
    })),
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRasAgenda(
  userId: string,
  data: CreateRasAgendaInput,
  statusOverride?: StatusRas,
): Promise<RasAgenda> {
  const valorCentavos = getRasPrice(data.graduacao, data.duracao)
  const row = await prisma.rasAgenda.create({
    data: {
      userId,
      data:          parseUTCDate(data.data),
      horaInicio:    data.horaInicio,
      horaFim:       data.horaFim,
      duracao:       data.duracao,
      local:         data.local,
      graduacao:     data.graduacao,
      tipo:          data.tipo,
      tipoVaga:      data.tipoVaga,
      valorCentavos,
      competencia:   data.competencia,
      observacoes:   data.observacoes ?? null,
      status:        statusOverride ?? 'agendado',
    },
    ...withRelations,
  })
  return mapRow(row)
}

// ─── Find by ID ───────────────────────────────────────────────────────────────

export async function findRasById(
  id: string,
): Promise<RasAgenda | null> {
  const row = await prisma.rasAgenda.findUnique({
    where: { id },
    ...withRelations,
  })
  return row ? mapRow(row) : null
}

/**
 * Like findRasById but also checks userId ownership.
 * Returns null when not found OR when userId does not match.
 */
export async function findRasByIdForUser(
  id: string,
  userId: string,
): Promise<RasAgenda | null> {
  const row = await prisma.rasAgenda.findFirst({
    where: { id, userId, ...ACTIVE_FILTER },
    ...withRelations,
  })
  return row ? mapRow(row) : null
}

// ─── List by user + month ─────────────────────────────────────────────────────

export async function findRasByUserAndMonth(
  userId: string,
  competencia: string,
): Promise<RasAgenda[]> {
  const rows = await prisma.rasAgenda.findMany({
    where: { userId, competencia, ...ACTIVE_FILTER },
    orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
    ...withRelations,
  })
  return rows.map(mapRow)
}

// ─── List by user + date ──────────────────────────────────────────────────────

export async function findRasByUserAndDate(
  userId: string,
  data: string,
): Promise<RasAgenda[]> {
  const day = parseUTCDate(data)
  const rows = await prisma.rasAgenda.findMany({
    where: { userId, data: day, status: { not: 'cancelado' }, ...ACTIVE_FILTER },
    orderBy: { horaInicio: 'asc' },
    ...withRelations,
  })
  return rows.map(mapRow)
}

// ─── Update status ────────────────────────────────────────────────────────────
// Uses updateMany so count=0 means not found or forbidden.

export async function updateRasStatus(
  id: string,
  userId: string,
  newStatus: StatusRas,
  extra?: { expiresAt?: Date | null; observacoes?: string | null },
): Promise<RasAgenda> {
  const result = await prisma.rasAgenda.updateMany({
    where: { id, userId },
    data: {
      status: newStatus,
      ...(extra?.expiresAt !== undefined ? { expiresAt: extra.expiresAt } : {}),
      ...(extra?.observacoes !== undefined ? { observacoes: extra.observacoes } : {}),
    },
  })
  if (result.count === 0) {
    throw new Error(`RAS ${id} não encontrado ou acesso negado`)
  }
  // Re-fetch to return the full record
  const updated = await findRasByIdForUser(id, userId)
  if (!updated) throw new Error(`RAS ${id} não encontrado após atualização`)
  return updated
}

// ─── Delete ───────────────────────────────────────────────────────────────────
// count=0 means not found or forbidden.

export async function deleteRas(
  id: string,
  userId: string,
): Promise<void> {
  const result = await prisma.rasAgenda.deleteMany({ where: { id, userId } })
  if (result.count === 0) {
    throw new Error(`RAS ${id} não encontrado ou acesso negado`)
  }
}

// ─── Aggregate: total hours for a user/month ──────────────────────────────────
// Only counts non-cancelled records.

export async function countRasHoursByUserAndMonth(
  userId: string,
  competencia: string,
): Promise<number> {
  const rows = await prisma.rasAgenda.findMany({
    where: {
      userId,
      competencia,
      status: { not: 'cancelado' },
      ...ACTIVE_FILTER,
    },
    select: { duracao: true },
  })
  return rows.reduce((sum, r) => sum + r.duracao, 0)
}

// ─── Duplicate check ──────────────────────────────────────────────────────────
// The unique constraint on (userId, data, horaInicio) guards against true dups,
// but this explicit check gives a friendlier error before hitting the DB constraint.

export async function existsDuplicateRas(
  userId: string,
  data: string,
  horaInicio: string,
): Promise<boolean> {
  const day = parseUTCDate(data)
  const count = await prisma.rasAgenda.count({
    where: {
      userId,
      data: day,
      horaInicio,
      status: { notIn: ['cancelado'] },
      deletadoEm: null,
    },
  })
  return count > 0
}

// ─── Adjacent RAS for rest validation ────────────────────────────────────────
// Returns the most recent non-cancelled RAS that ended before the requested start,
// and the next one that starts after the requested end. Used by the service to
// validate the 8-hour minimum rest rule.

export async function findAdjacentRas(
  userId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
): Promise<{ before: RasAgenda | null; after: RasAgenda | null }> {
  const day = parseUTCDate(data)

  const [beforeRow, afterRow] = await Promise.all([
    // Most recent RAS ending before our start on the same day or earlier
    prisma.rasAgenda.findFirst({
      where: {
        userId,
        status: { not: 'cancelado' },
        ...ACTIVE_FILTER,
        OR: [
          // Same day, ends before our start
          { data: day, horaFim: { lte: horaInicio } },
          // Previous days
          { data: { lt: day } },
        ],
      },
      orderBy: [{ data: 'desc' }, { horaFim: 'desc' }],
      ...withRelations,
    }),
    // Earliest RAS starting after our end on the same day or later
    prisma.rasAgenda.findFirst({
      where: {
        userId,
        status: { not: 'cancelado' },
        ...ACTIVE_FILTER,
        OR: [
          // Same day, starts after our end
          { data: day, horaInicio: { gte: horaFim } },
          // Future days
          { data: { gt: day } },
        ],
      },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      ...withRelations,
    }),
  ])

  return {
    before: beforeRow ? mapRow(beforeRow) : null,
    after:  afterRow  ? mapRow(afterRow)  : null,
  }
}

// ─── Soft Delete (GDPR/Compliance) ────────────────────────────────────────────
// Instead of hard delete, mark as deleted. Allows recovery and audit trails.

export async function softDeleteRas(
  id: string,
  userId: string,
  motivo?: string,
): Promise<void> {
  const result = await prisma.rasAgenda.updateMany({
    where: { id, userId, ...ACTIVE_FILTER },
    data: {
      deletadoEm: new Date(),
      motivoDelecao: motivo ?? null,
    },
  })
  if (result.count === 0) {
    throw new Error(`RAS_NOT_FOUND:${id}`)
  }
}

/**
 * Find recently deleted RAS for admin recovery/inspection.
 * IMPORTANT: Only call this with admin/auditor context.
 */
export async function findDeletedRasByUser(
  userId: string,
  limit: number = 100,
): Promise<RasAgenda[]> {
  const rows = await prisma.rasAgenda.findMany({
    where: {
      userId,
      deletadoEm: { not: null }, // Only deleted
    },
    orderBy: { deletadoEm: 'desc' },
    take: limit,
    ...withRelations,
  })
  return rows.map(mapRow)
}

/**
 * Hard delete (used only by admins for data cleanup, after retention period).
 * DANGER: This is permanent and breaks audit trails.
 */
export async function hardDeleteRas(
  id: string,
  userId: string,
): Promise<void> {
  const result = await prisma.rasAgenda.deleteMany({
    where: { id, userId },
  })
  if (result.count === 0) {
    throw new Error(`RAS ${id} não encontrado ou acesso negado`)
  }
}
