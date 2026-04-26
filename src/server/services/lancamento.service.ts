// Lancamento Service — orchestrates validation, repository and finance engine.
// Rules:
//   1. Validate all input with Zod — never trust raw body.
//   2. userId always comes from session, never from client payload.
//   3. Call finance.engine.ts for financial calculations — never inline formulas.
//   4. Raise errors that API routes can map to HTTP responses.

import {
  createLancamentoSchema,
  updateLancamentoSchema,
  lancamentoFiltersSchema,
} from '@/features/lancamentos/schemas'
import type {
  CreateLancamentoInput,
  UpdateLancamentoInput,
  LancamentoFilters,
  LancamentoSummaryDTO,
} from '@/features/lancamentos/types'
import * as repo from '@/server/repositories/lancamento.repository'
import {
  calculateTotals,
  calculateSavingsRate,
  type TransactionRow,
} from '@/server/engines/finance.engine'

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createLancamentoForUser(
  userId: string,
  input: CreateLancamentoInput,
) {
  const validated = createLancamentoSchema.parse(input)
  // Derive competenciaAt from data when not explicitly provided
  const competenciaAt = validated.competenciaAt ?? validated.data.slice(0, 7)
  return repo.createLancamento(userId, { ...validated, competenciaAt })
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateLancamentoForUser(
  userId: string,
  id: string,
  input: UpdateLancamentoInput,
) {
  const validated = updateLancamentoSchema.parse(input)
  const result = await repo.updateLancamento(userId, id, validated)
  if (result.count === 0) throw new NotFoundOrForbiddenError()
  // Return the updated record so the API can respond with the full object
  return repo.findLancamentoById(userId, id)
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLancamentoForUser(userId: string, id: string) {
  const result = await repo.deleteLancamento(userId, id)
  if (result.count === 0) throw new NotFoundOrForbiddenError()
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listLancamentosForUser(
  userId: string,
  rawFilters: LancamentoFilters,
) {
  const filters = lancamentoFiltersSchema.parse(rawFilters)
  return repo.listLancamentosByUser(userId, filters)
}

// ─── Financial summary for one month ─────────────────────────────────────────

export async function getLancamentosSummaryForUser(
  userId: string,
  mes: string,
): Promise<LancamentoSummaryDTO> {
  const rows = await repo.getLancamentosForFinancialSnapshot(userId, mes)

  const mapped: TransactionRow[] = rows.map(r => ({
    valorCentavos: r.valorCentavos,
    tipo:          r.tipo as TransactionRow['tipo'],
    // Prisma returns JsonValue — we only store objects in metaJson
    metaJson:      (r.metaJson && typeof r.metaJson === 'object' && !Array.isArray(r.metaJson))
                     ? (r.metaJson as Record<string, unknown>)
                     : null,
  }))

  const totals     = calculateTotals(mapped)
  const savingsRate = calculateSavingsRate(totals)

  return {
    competenciaAt:   mes,
    totalIncome:     totals.totalIncome,
    totalExpense:    totals.totalExpense,
    totalRas:        totals.totalRas,
    totalAportes:    totals.totalAportes,
    totalResgates:   totals.totalResgates,
    balance:         totals.balance,
    savingsRate,
    totalLancamentos: rows.length,
  }
}

// ─── Domain errors ────────────────────────────────────────────────────────────

export class NotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Lançamento não encontrado ou acesso negado')
    this.name = 'NotFoundOrForbiddenError'
  }
}
