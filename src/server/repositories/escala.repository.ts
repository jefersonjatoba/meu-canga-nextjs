// Escala Repository — sole Prisma access point for escalas.
// Rules:
//   1. Every query filters by userId — never return another user's data.
//   2. No RAS logic, no business rules — pure data access only.
//   3. All date params are "YYYY-MM-DD" strings; convert to UTC Date before querying.

import { prisma } from '@/lib/prisma'
import type { Escala } from '@/types/escala'

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

/** Map a raw Prisma Escala row to the domain Escala type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Escala {
  return {
    id:           row.id,
    userId:       row.userId,
    dataEscala:   row.dataEscala instanceof Date
                    ? row.dataEscala.toISOString().slice(0, 10)
                    : String(row.dataEscala).slice(0, 10),
    tipoPlantao:  row.tipoTurno,   // DB column is tipoTurno; domain calls it tipoPlantao
    tipoCiclo:    row.tipoCiclo ?? null,
    horaInicio:   row.horaInicio,
    horaFim:      row.horaFim,
    localServico: row.localServico ?? null,
    observacoes:  row.observacoes ?? null,
    status:       row.status,
    createdAt:    row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt:    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all escalas for `userId` on `data` (YYYY-MM-DD).
 * Excludes cancelled records — used for conflict detection.
 */
export async function findEscalasByUserAndDate(
  userId: string,
  data: string,
): Promise<Escala[]> {
  const day = parseUTCDate(data)
  const rows = await prisma.escala.findMany({
    where: {
      userId,
      dataEscala: day,
      status: { not: 'cancelada' },
    },
    orderBy: { horaInicio: 'asc' },
  })
  return rows.map(mapRow)
}

/**
 * Returns the first escala that overlaps the given time window on `data`.
 * "Overlap" means the existing shift starts before `horaFim` AND ends after `horaInicio`.
 * Returns null when no conflict exists.
 */
export async function findEscalaConflict(
  userId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
): Promise<Escala | null> {
  const day = parseUTCDate(data)
  const row = await prisma.escala.findFirst({
    where: {
      userId,
      dataEscala: day,
      status: { not: 'cancelada' },
      // Overlap condition: existing.horaInicio < horaFim AND existing.horaFim > horaInicio
      AND: [
        { horaInicio: { lt: horaFim } },
        { horaFim:    { gt: horaInicio } },
      ],
    },
  })
  return row ? mapRow(row) : null
}

/**
 * Returns all escalas for `userId` within the given "YYYY-MM" competência.
 * Ordered by date ascending.
 */
export async function findEscalasByUserAndMonth(
  userId: string,
  competencia: string,
): Promise<Escala[]> {
  const range = monthRange(competencia)
  const rows = await prisma.escala.findMany({
    where: {
      userId,
      dataEscala: range,
    },
    orderBy: { dataEscala: 'asc' },
  })
  return rows.map(mapRow)
}

/**
 * Returns the total number of escala records (all statuses) for `userId`.
 * Useful for pagination metadata or rate-limit guards.
 */
export async function countEscalasByUser(userId: string): Promise<number> {
  return prisma.escala.count({ where: { userId } })
}
