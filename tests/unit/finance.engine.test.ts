import { describe, it, expect } from 'vitest'
import {
  calculateTotals,
  calculatePatrimonio,
  calculateSavingsRate,
  calculateMonthlyProjection,
  calculateDashboardSummary,
  type TransactionRow,
} from '../../src/server/engines/finance.engine'

// Helper para criar linhas de teste rapidamente
const row = (tipo: TransactionRow['tipo'], valorCentavos: number): TransactionRow => ({
  tipo,
  valorCentavos,
})

// ─── calculateTotals ──────────────────────────────────────────────────────────

describe('calculateTotals', () => {
  it('array vazio → todos zeros', () => {
    const r = calculateTotals([])
    expect(r.totalIncome).toBe(0)
    expect(r.totalExpense).toBe(0)
    expect(r.totalRas).toBe(0)
    expect(r.totalAportes).toBe(0)
    expect(r.totalResgates).toBe(0)
    expect(r.balance).toBe(0)
    expect(r.totalRasHours).toBe(0)
  })

  it('só income → balance = income', () => {
    const r = calculateTotals([row('income', 500_000)])
    expect(r.balance).toBe(500_000)
    expect(r.totalIncome).toBe(500_000)
  })

  it('despesas reduzem o balance', () => {
    const rows = [row('income', 500_000), row('expense', 200_000)]
    const r = calculateTotals(rows)
    expect(r.balance).toBe(300_000)
    expect(r.totalExpense).toBe(200_000)
  })

  it('RAS é rastreado mas NÃO subtrai do balance operacional', () => {
    const rows = [row('income', 500_000), row('ras', 78_321)]
    const r = calculateTotals(rows)
    expect(r.totalRas).toBe(78_321)
    expect(r.balance).toBe(500_000) // RAS não afeta saldo
  })

  it('investment_aporte reduz balance', () => {
    const rows = [row('income', 500_000), row('investment_aporte', 100_000)]
    const r = calculateTotals(rows)
    expect(r.balance).toBe(400_000)
    expect(r.totalAportes).toBe(100_000)
  })

  it('investment_resgate aumenta balance', () => {
    const rows = [row('income', 500_000), row('investment_resgate', 50_000)]
    const r = calculateTotals(rows)
    expect(r.balance).toBe(550_000)
    expect(r.totalResgates).toBe(50_000)
  })

  it('cenário completo — fórmula: income - expense - aportes + resgates', () => {
    // R$ 10.000 salário, R$ 3.000 despesas, R$ 783,21 RAS, R$ 2.000 aporte, R$ 500 resgate
    const rows = [
      row('income', 1_000_000),
      row('expense', 300_000),
      row('ras', 78_321),
      row('investment_aporte', 200_000),
      row('investment_resgate', 50_000),
    ]
    const r = calculateTotals(rows)
    expect(r.totalIncome).toBe(1_000_000)
    expect(r.totalExpense).toBe(300_000)
    expect(r.totalRas).toBe(78_321)
    expect(r.totalAportes).toBe(200_000)
    expect(r.totalResgates).toBe(50_000)
    // 1.000.000 - 300.000 - 200.000 + 50.000 = 550.000
    expect(r.balance).toBe(550_000)
  })

  it('múltiplos lançamentos do mesmo tipo são somados', () => {
    const rows = [
      row('income', 300_000),
      row('income', 200_000),
      row('expense', 100_000),
      row('expense', 50_000),
    ]
    const r = calculateTotals(rows)
    expect(r.totalIncome).toBe(500_000)
    expect(r.totalExpense).toBe(150_000)
    expect(r.balance).toBe(350_000)
  })

  it('extrai horas RAS de metaJson.ras_horas', () => {
    const rows: TransactionRow[] = [
      { tipo: 'ras', valorCentavos: 78_321, metaJson: { ras_horas: '12' } },
      { tipo: 'ras', valorCentavos: 40_015, metaJson: { ras_horas: '8' } },
    ]
    const r = calculateTotals(rows)
    expect(r.totalRasHours).toBe(20)
  })

  it('extrai horas RAS de metaJson.hours (campo alternativo)', () => {
    const rows: TransactionRow[] = [
      { tipo: 'ras', valorCentavos: 78_321, metaJson: { hours: 6 } },
    ]
    const r = calculateTotals(rows)
    expect(r.totalRasHours).toBe(6)
  })

  it('ignora metaJson nulo/ausente ao somar horas', () => {
    const rows: TransactionRow[] = [
      row('ras', 78_321),
      { tipo: 'ras', valorCentavos: 40_015, metaJson: null },
    ]
    const r = calculateTotals(rows)
    expect(r.totalRasHours).toBe(0)
  })

  it('transfer não afeta nenhum total', () => {
    const rows = [row('income', 500_000), row('transfer', 100_000)]
    const r = calculateTotals(rows)
    expect(r.balance).toBe(500_000) // transfer não muda balance
    expect(r.totalIncome).toBe(500_000)
  })
})

// ─── calculatePatrimonio ──────────────────────────────────────────────────────

describe('calculatePatrimonio', () => {
  it('sem investimentos → patrimônio zero', () => {
    const r = calculatePatrimonio([row('income', 500_000), row('expense', 200_000)])
    expect(r.patrimonioLiquido).toBe(0)
    expect(r.totalAportes).toBe(0)
    expect(r.totalResgates).toBe(0)
  })

  it('só aportes → patrimônio positivo', () => {
    const r = calculatePatrimonio([row('investment_aporte', 300_000)])
    expect(r.totalAportes).toBe(300_000)
    expect(r.patrimonioLiquido).toBe(300_000)
  })

  it('patrimônio líquido = aportes - resgates', () => {
    const rows = [
      row('investment_aporte', 500_000),
      row('investment_resgate', 150_000),
    ]
    const r = calculatePatrimonio(rows)
    expect(r.patrimonioLiquido).toBe(350_000)
  })

  it('resgates maiores que aportes → patrimônio negativo', () => {
    const rows = [
      row('investment_aporte', 100_000),
      row('investment_resgate', 200_000),
    ]
    const r = calculatePatrimonio(rows)
    expect(r.patrimonioLiquido).toBe(-100_000)
  })
})

// ─── calculateSavingsRate ─────────────────────────────────────────────────────

describe('calculateSavingsRate', () => {
  it('income zero → 0%', () => {
    const totals = calculateTotals([])
    expect(calculateSavingsRate(totals)).toBe(0)
  })

  it('sem despesas → 100%', () => {
    const totals = calculateTotals([row('income', 100_000)])
    expect(calculateSavingsRate(totals)).toBe(100)
  })

  it('cenário normal — 30% de poupança', () => {
    const rows = [row('income', 1_000_000), row('expense', 700_000)]
    const totals = calculateTotals(rows)
    expect(calculateSavingsRate(totals)).toBe(30)
  })

  it('balance negativo → clampado em 0%', () => {
    const rows = [row('income', 100_000), row('expense', 200_000)]
    const totals = calculateTotals(rows)
    expect(calculateSavingsRate(totals)).toBe(0)
  })

  it('nunca ultrapassa 100%', () => {
    // Resgate inflando o balance além da receita
    const rows = [row('income', 100_000), row('investment_resgate', 500_000)]
    const totals = calculateTotals(rows)
    expect(calculateSavingsRate(totals)).toBe(100)
  })
})

// ─── calculateMonthlyProjection ───────────────────────────────────────────────

describe('calculateMonthlyProjection', () => {
  it('histórico vazio → projeção vazia', () => {
    expect(calculateMonthlyProjection([])).toEqual([])
  })

  it('months = 0 → array vazio', () => {
    const historico = [{ competencia: '2026-01', totalIncome: 1_000_000, totalExpense: 700_000, balance: 300_000 }]
    expect(calculateMonthlyProjection(historico, 0)).toEqual([])
  })

  it('projeta 3 meses à frente por padrão', () => {
    const historico = [
      { competencia: '2026-01', totalIncome: 1_000_000, totalExpense: 700_000, balance: 300_000 },
    ]
    const proj = calculateMonthlyProjection(historico)
    expect(proj).toHaveLength(3)
    expect(proj[0].competencia).toBe('2026-02')
    expect(proj[1].competencia).toBe('2026-03')
    expect(proj[2].competencia).toBe('2026-04')
  })

  it('usa a média dos meses históricos', () => {
    const historico = [
      { competencia: '2026-01', totalIncome: 1_000_000, totalExpense: 800_000, balance: 200_000 },
      { competencia: '2026-02', totalIncome: 1_200_000, totalExpense: 900_000, balance: 300_000 },
    ]
    const proj = calculateMonthlyProjection(historico, 1)
    // avg income = 1.100.000, avg expense = 850.000
    expect(proj[0].projectedIncome).toBe(1_100_000)
    expect(proj[0].projectedExpense).toBe(850_000)
    expect(proj[0].projectedBalance).toBe(250_000)
  })

  it('avança o ano corretamente em dezembro', () => {
    const historico = [
      { competencia: '2026-12', totalIncome: 1_000_000, totalExpense: 700_000, balance: 300_000 },
    ]
    const proj = calculateMonthlyProjection(historico, 2)
    expect(proj[0].competencia).toBe('2027-01')
    expect(proj[1].competencia).toBe('2027-02')
  })
})

// ─── calculateDashboardSummary ────────────────────────────────────────────────

describe('calculateDashboardSummary', () => {
  it('combina totals + patrimônio + taxa de poupança', () => {
    const rows = [
      row('income', 1_000_000),
      row('expense', 600_000),
      row('investment_aporte', 100_000),
    ]
    const s = calculateDashboardSummary(rows)

    // balance = 1M - 600k - 100k = 300k
    expect(s.balance).toBe(300_000)
    expect(s.totalIncome).toBe(1_000_000)
    expect(s.totalExpense).toBe(600_000)
    expect(s.totalAportes).toBe(100_000)

    // savingsRate = 300k / 1M = 30%
    expect(s.savingsRate).toBe(30)

    // patrimônio = aportes - resgates = 100k
    expect(s.patrimonio.patrimonioLiquido).toBe(100_000)
  })

  it('array vazio → zeros em tudo', () => {
    const s = calculateDashboardSummary([])
    expect(s.balance).toBe(0)
    expect(s.savingsRate).toBe(0)
    expect(s.patrimonio.patrimonioLiquido).toBe(0)
  })
})
