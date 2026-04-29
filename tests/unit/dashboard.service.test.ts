import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/services/lancamento.service', () => ({
  getLancamentosSummaryForUser: vi.fn(),
  listLancamentosForUser: vi.fn(),
}))

vi.mock('@/server/services/cartao.service', () => ({
  getCreditCardDashboardSummary: vi.fn(),
}))

vi.mock('@/lib/dates', () => ({
  currentMonthBR: vi.fn(() => '2026-04'),
}))

import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import * as lancamentoService from '@/server/services/lancamento.service'
import * as cartaoService from '@/server/services/cartao.service'

const mockGetSummary    = vi.mocked(lancamentoService.getLancamentosSummaryForUser)
const mockListLancamentos = vi.mocked(lancamentoService.listLancamentosForUser)
const mockGetCartaoSummary = vi.mocked(cartaoService.getCreditCardDashboardSummary)

const emptySummary = {
  competenciaAt:   '2026-04',
  totalIncome:     0,
  totalExpense:    0,
  totalRas:        0,
  totalAportes:    0,
  totalResgates:   0,
  balance:         0,
  savingsRate:     0,
  totalLancamentos: 0,
}

const emptyListResult = {
  items:      [],
  total:      0,
  page:       1,
  pageSize:   5,
  totalPages: 0,
}

const emptyCartaoSummary = {
  totalCartoes: 0,
  totalLimiteCentavos: 0,
  limiteUsadoCentavos: 0,
  limiteDisponivelCentavos: 0,
  totalFaturasAbertas: 0,
  valorFaturasAbertasCentavos: 0,
  proximaFatura: null,
  faturasProximas: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSummary.mockResolvedValue(emptySummary)
  mockGetCartaoSummary.mockResolvedValue(emptyCartaoSummary)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockListLancamentos.mockResolvedValue(emptyListResult as any)
})

describe('getDashboardSummaryForUser', () => {
  it('returns zero totals when no transactions', async () => {
    const result = await getDashboardSummaryForUser('user1', {})
    expect(result.saldoOperacionalCentavos).toBe(0)
    expect(result.totalReceitasCentavos).toBe(0)
    expect(result.totalDespesasCentavos).toBe(0)
    expect(result.hasLancamentos).toBe(false)
    expect(result.lancamentosRecentes).toHaveLength(0)
    expect(result.cartao).toEqual(emptyCartaoSummary)
  })

  it('uses currentMonthBR when no mes param provided', async () => {
    await getDashboardSummaryForUser('user1', {})
    expect(mockGetSummary).toHaveBeenCalledWith('user1', '2026-04')
  })

  it('uses the provided mes param', async () => {
    await getDashboardSummaryForUser('user1', { mes: '2026-03' })
    expect(mockGetSummary).toHaveBeenCalledWith('user1', '2026-03')
  })

  it('falls back to currentMonthBR on invalid mes format', async () => {
    await getDashboardSummaryForUser('user1', { mes: 'invalid' })
    expect(mockGetSummary).toHaveBeenCalledWith('user1', '2026-04')
  })

  it('maps saldo, receitas and despesas from summary', async () => {
    mockGetSummary.mockResolvedValue({
      ...emptySummary,
      totalIncome:  500000,
      totalExpense: 200000,
      balance:      300000,
    })
    const result = await getDashboardSummaryForUser('user1', { mes: '2026-04' })
    expect(result.totalReceitasCentavos).toBe(500000)
    expect(result.totalDespesasCentavos).toBe(200000)
    expect(result.saldoOperacionalCentavos).toBe(300000)
  })

  it('maps taxa de poupança from savingsRate', async () => {
    mockGetSummary.mockResolvedValue({ ...emptySummary, savingsRate: 45.5 })
    const result = await getDashboardSummaryForUser('user1', {})
    expect(result.taxaPoupancaPercentual).toBe(45.5)
  })

  it('calculates patrimônio investido from aportes minus resgates', async () => {
    mockGetSummary.mockResolvedValue({
      ...emptySummary,
      totalAportes:  100000,
      totalResgates: 30000,
    })
    const result = await getDashboardSummaryForUser('user1', {})
    expect(result.patrimonioInvestidoCentavos).toBe(70000)
  })

  it('maps lancamentos recentes from list result', async () => {
    const mockItem = {
      id:            'l1',
      descricao:     'Salário PMESP',
      tipo:          'income',
      categoria:     'Salário',
      valorCentavos: 500000,
      data:          new Date('2026-04-01'),
      status:        'confirmada',
      conta:         { id: 'c1', nome: 'Conta Principal', tipo: 'corrente' },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockListLancamentos.mockResolvedValue({ ...emptyListResult, items: [mockItem as any], total: 1 })
    const result = await getDashboardSummaryForUser('user1', {})
    expect(result.hasLancamentos).toBe(true)
    expect(result.lancamentosRecentes).toHaveLength(1)
    expect(result.lancamentosRecentes[0].descricao).toBe('Salário PMESP')
    expect(result.lancamentosRecentes[0].valorCentavos).toBe(500000)
  })

  it('sets hasLancamentos false when list total is zero', async () => {
    mockListLancamentos.mockResolvedValue({ ...emptyListResult, total: 0 } as any)
    const result = await getDashboardSummaryForUser('user1', {})
    expect(result.hasLancamentos).toBe(false)
  })

  it('includes formatted periodoLabel for the period', async () => {
    const result = await getDashboardSummaryForUser('user1', { mes: '2026-04' })
    expect(result.periodo).toBe('2026-04')
    expect(result.periodoLabel).toMatch(/Abril.*2026/)
  })

  it('passes userId to all service calls — no cross-user leakage', async () => {
    await getDashboardSummaryForUser('user-xyz', { mes: '2026-04' })
    expect(mockGetSummary).toHaveBeenCalledWith('user-xyz', '2026-04')
    expect(mockListLancamentos).toHaveBeenCalledWith('user-xyz', expect.any(Object))
    expect(mockGetCartaoSummary).toHaveBeenCalledWith('user-xyz')
  })

  it('inclui resumo operacional de cartao sem alterar despesas financeiras', async () => {
    mockGetSummary.mockResolvedValue({
      ...emptySummary,
      totalExpense: 120000,
      balance: -120000,
    })
    mockGetCartaoSummary.mockResolvedValue({
      totalCartoes: 1,
      totalLimiteCentavos: 500000,
      limiteUsadoCentavos: 120000,
      limiteDisponivelCentavos: 380000,
      totalFaturasAbertas: 1,
      valorFaturasAbertasCentavos: 120000,
      proximaFatura: {
        id: 'fat_1',
        contaId: 'card_1',
        contaNome: 'Nubank',
        competencia: '2026-05',
        dataVencimento: new Date('2026-05-10T00:00:00Z'),
        status: 'aberta',
        totalCentavos: 120000,
      },
      faturasProximas: [],
    })

    const result = await getDashboardSummaryForUser('user1', { mes: '2026-04' })

    expect(result.totalDespesasCentavos).toBe(120000)
    expect(result.cartao.valorFaturasAbertasCentavos).toBe(120000)
    expect(result.saldoOperacionalCentavos).toBe(-120000)
  })
})
