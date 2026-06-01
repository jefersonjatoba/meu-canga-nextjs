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
import { ensureCategoriaBelongsToUser } from '@/server/services/categoria.service'
import { prisma } from '@/lib/prisma'
import {
  calculateTotals,
  calculateSavingsRate,
  type TransactionRow,
} from '@/server/engines/finance.engine'

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createLancamentoForUser(
  userId: string,
  input: CreateLancamentoInput,
  opts?: { idempotencyKey?: string; ipAddress?: string },
) {
  const validated = createLancamentoSchema.parse(input)

  // Guarantee contaId belongs to this user — never trust client-supplied IDs
  const conta = await prisma.conta.findFirst({
    where: { id: validated.contaId, userId, ativa: true },
    select: { id: true },
  })
  if (!conta) throw new ContaNotFoundOrForbiddenError()

  const categoria = await ensureCategoriaBelongsToUser(userId, validated.categoriaId)
  const competenciaAt = validated.competenciaAt ?? validated.data.slice(0, 7)
  const createData = { ...validated, categoria: categoria?.nome ?? validated.categoria, competenciaAt, idempotencyKey: opts?.idempotencyKey }
  return opts?.ipAddress
    ? repo.createLancamento(userId, createData, opts.ipAddress)
    : repo.createLancamento(userId, createData)
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateLancamentoForUser(
  userId: string,
  id: string,
  input: UpdateLancamentoInput,
  opts?: { ipAddress?: string },
) {
  const validated = updateLancamentoSchema.parse(input)
  const categoria = await ensureCategoriaBelongsToUser(userId, validated.categoriaId)
  const updateData = { ...validated, categoria: categoria?.nome ?? validated.categoria }
  const result = opts?.ipAddress
    ? await repo.updateLancamento(userId, id, updateData, opts.ipAddress)
    : await repo.updateLancamento(userId, id, updateData)
  if (result.count === 0) throw new NotFoundOrForbiddenError()
  return repo.findLancamentoById(userId, id)
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteLancamentoForUser(userId: string, id: string, opts?: { ipAddress?: string }) {
  const result = opts?.ipAddress
    ? await repo.deleteLancamento(userId, id, opts.ipAddress)
    : await repo.deleteLancamento(userId, id)
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

// ─── Patrimônio investido acumulado (histórico total) ────────────────────────

export async function getPatrimonioAcumulado(userId: string) {
  return repo.getPatrimonioInvestidoAcumulado(userId)
}

// ─── Domain errors ────────────────────────────────────────────────────────────

export class NotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Lançamento não encontrado ou acesso negado')
    this.name = 'NotFoundOrForbiddenError'
  }
}

export class ContaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta não encontrada ou acesso negado')
    this.name = 'ContaNotFoundOrForbiddenError'
  }
}
