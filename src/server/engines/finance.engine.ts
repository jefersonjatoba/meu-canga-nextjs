// Finance Engine — pure functions, no I/O, fully testable.
// Migrated from MeuCanga_v1: core/finance.engine.js
//
// All monetary values in centavos (Int). Float is never used here.
//
// Transaction types:
//   income              → Receita operacional (+saldo)
//   expense             → Despesa operacional (-saldo)
//   ras                 → RAS — rastreado separadamente, NÃO afeta saldo
//   investment_aporte   → Aporte: sai do saldo, entra no patrimônio
//   investment_resgate  → Resgate: sai do patrimônio, volta ao saldo
//   transfer            → Transferência interna (líquido zero)

export type TransactionType =
  | 'income'
  | 'expense'
  | 'ras'
  | 'investment_aporte'
  | 'investment_resgate'
  | 'transfer'

export interface TransactionRow {
  valorCentavos: number
  tipo: TransactionType
  metaJson?: Record<string, unknown> | null
}

export interface FinanceTotals {
  totalIncome: number         // centavos
  totalExpense: number        // centavos
  totalRas: number            // centavos — excluído do saldo operacional
  totalRasHours: number       // horas extraídas de metaJson
  totalAportes: number        // centavos
  totalResgates: number       // centavos
  balance: number             // centavos — saldo operacional
}

export interface PatrimonioResult {
  totalAportes: number        // centavos — acumulado histórico
  totalResgates: number       // centavos — acumulado histórico
  patrimonioLiquido: number   // centavos
}

export interface MonthlySnapshot {
  competencia: string         // "yyyy-MM"
  totalIncome: number         // centavos
  totalExpense: number        // centavos
  balance: number             // centavos
}

export interface MonthlyProjection {
  competencia: string
  projectedIncome: number     // centavos
  projectedExpense: number    // centavos
  projectedBalance: number    // centavos
}

export interface DashboardSummary extends FinanceTotals {
  savingsRate: number         // 0–100 (%)
  patrimonio: PatrimonioResult
}

// ─── calculateTotals ──────────────────────────────────────────────────────────
// Primary aggregation for a set of transactions (typically one month).
// Mirrors the logic of core/finance.engine.js#calculateTotals exactly.

export function calculateTotals(rows: TransactionRow[]): FinanceTotals {
  const totalIncome   = sumByType(rows, 'income')
  const totalExpense  = sumByType(rows, 'expense')
  const totalRas      = sumByType(rows, 'ras')
  const totalAportes  = sumByType(rows, 'investment_aporte')
  const totalResgates = sumByType(rows, 'investment_resgate')

  // RAS is tracked but intentionally excluded from operational balance.
  // Transfers net to zero by definition.
  const balance = totalIncome - totalExpense - totalAportes + totalResgates

  const totalRasHours = rows
    .filter(r => r.tipo === 'ras' && r.metaJson != null)
    .reduce((acc, r) => {
      const h = Number(r.metaJson!.ras_horas ?? r.metaJson!.hours ?? 0)
      return acc + (isFinite(h) ? h : 0)
    }, 0)

  return {
    totalIncome,
    totalExpense,
    totalRas,
    totalRasHours,
    totalAportes,
    totalResgates,
    balance,
  }
}

// ─── calculatePatrimonio ──────────────────────────────────────────────────────
// Computes net investment patrimônio from ALL historical rows (not just one month).
// Mirrors core/finance.engine.js#calculatePatrimonio.

export function calculatePatrimonio(allRows: TransactionRow[]): PatrimonioResult {
  const totalAportes  = sumByType(allRows, 'investment_aporte')
  const totalResgates = sumByType(allRows, 'investment_resgate')
  return {
    totalAportes,
    totalResgates,
    patrimonioLiquido: totalAportes - totalResgates,
  }
}

// ─── calculateSavingsRate ─────────────────────────────────────────────────────
// Savings rate as percentage of income saved (0–100, never negative).

export function calculateSavingsRate(totals: FinanceTotals): number {
  if (totals.totalIncome === 0) return 0
  const rate = (totals.balance / totals.totalIncome) * 100
  return Math.max(0, Math.min(100, round2(rate)))
}

// ─── calculateMonthlyProjection ───────────────────────────────────────────────
// Projects `months` future months using simple average of historico snapshots.

export function calculateMonthlyProjection(
  historico: MonthlySnapshot[],
  months = 3,
): MonthlyProjection[] {
  if (historico.length === 0 || months <= 0) return []

  const avgIncome  = average(historico.map(m => m.totalIncome))
  const avgExpense = average(historico.map(m => m.totalExpense))

  const last = historico[historico.length - 1]
  const [lastYear, lastMonth] = last.competencia.split('-').map(Number)

  return Array.from({ length: months }, (_, i) => {
    const offset = lastMonth + i + 1
    const year  = lastYear + Math.floor((offset - 1) / 12)
    const month = ((offset - 1) % 12) + 1
    const competencia = `${year}-${String(month).padStart(2, '0')}`
    const projectedIncome  = Math.round(avgIncome)
    const projectedExpense = Math.round(avgExpense)
    return {
      competencia,
      projectedIncome,
      projectedExpense,
      projectedBalance: projectedIncome - projectedExpense,
    }
  })
}

// ─── calculateDashboardSummary ────────────────────────────────────────────────
// Convenience: combines totals + patrimônio + savings rate for the dashboard.

export function calculateDashboardSummary(rows: TransactionRow[]): DashboardSummary {
  const totals     = calculateTotals(rows)
  const patrimonio = calculatePatrimonio(rows)
  const savingsRate = calculateSavingsRate(totals)
  return { ...totals, savingsRate, patrimonio }
}

// ─── Internals ────────────────────────────────────────────────────────────────

function sumByType(rows: TransactionRow[], tipo: TransactionType): number {
  return rows
    .filter(r => r.tipo === tipo)
    .reduce((acc, r) => acc + r.valorCentavos, 0)
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
