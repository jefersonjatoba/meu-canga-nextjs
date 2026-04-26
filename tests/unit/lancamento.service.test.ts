import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Mock repository before service import ───────────────────────────────────

vi.mock('@/server/repositories/lancamento.repository', () => ({
  createLancamento:                    vi.fn(),
  updateLancamento:                    vi.fn(),
  deleteLancamento:                    vi.fn(),
  findLancamentoById:                  vi.fn(),
  listLancamentosByUser:               vi.fn(),
  listLancamentosByMonth:              vi.fn(),
  getLancamentosForFinancialSnapshot:  vi.fn(),
}))

import * as repo from '@/server/repositories/lancamento.repository'
import {
  createLancamentoForUser,
  updateLancamentoForUser,
  deleteLancamentoForUser,
  listLancamentosForUser,
  getLancamentosSummaryForUser,
  NotFoundOrForbiddenError,
} from '@/server/services/lancamento.service'
import { ZodError } from 'zod'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const USER_A = 'user_aaa'
const USER_B = 'user_bbb'
const LANCAMENTO_ID = 'lancamento_111'
const CONTA_ID = 'conta_111'

const baseInput = {
  contaId:       CONTA_ID,
  descricao:     'Salário',
  tipo:          'income' as const,
  categoria:     'Salário',
  valorCentavos: 1_000_000,
  data:          '2026-04-15',
}

const mockLancamento = {
  id:             LANCAMENTO_ID,
  userId:         USER_A,
  contaId:        CONTA_ID,
  descricao:      'Salário',
  tipo:           'income',
  categoria:      'Salário',
  valorCentavos:  1_000_000,
  data:           new Date('2026-04-15'),
  competenciaAt:  '2026-04',
  source:         'manual',
  status:         'confirmada',
  metaJson:       null,
  parcelas:       null,
  parcelaAtual:   null,
  parentId:       null,
  recorrenciaId:  null,
  createdAt:      new Date(),
  updatedAt:      new Date(),
  conta:          { id: CONTA_ID, nome: 'Conta Corrente', tipo: 'checking' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── createLancamentoForUser ──────────────────────────────────────────────────

describe('createLancamentoForUser', () => {
  it('cria receita válida chamando o repository com dados corretos', async () => {
    vi.mocked(repo.createLancamento).mockResolvedValue(mockLancamento as never)

    const result = await createLancamentoForUser(USER_A, baseInput)

    expect(repo.createLancamento).toHaveBeenCalledOnce()
    expect(repo.createLancamento).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({
        tipo:          'income',
        valorCentavos: 1_000_000,
        competenciaAt: '2026-04',   // derivado da data quando não fornecido
      }),
    )
    expect(result).toEqual(mockLancamento)
  })

  it('cria despesa válida', async () => {
    vi.mocked(repo.createLancamento).mockResolvedValue({
      ...mockLancamento, tipo: 'expense', valorCentavos: 50_000,
    } as never)

    await createLancamentoForUser(USER_A, {
      ...baseInput,
      tipo:          'expense',
      valorCentavos: 50_000,
      descricao:     'Aluguel',
    })

    expect(repo.createLancamento).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ tipo: 'expense', valorCentavos: 50_000 }),
    )
  })

  it('usa competenciaAt fornecida quando presente', async () => {
    vi.mocked(repo.createLancamento).mockResolvedValue(mockLancamento as never)

    await createLancamentoForUser(USER_A, {
      ...baseInput,
      data:          '2026-04-30',
      competenciaAt: '2026-05',
    })

    expect(repo.createLancamento).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ competenciaAt: '2026-05' }),
    )
  })

  it('rejeita valorCentavos = 0 com ZodError', async () => {
    await expect(
      createLancamentoForUser(USER_A, { ...baseInput, valorCentavos: 0 }),
    ).rejects.toThrow(ZodError)
    expect(repo.createLancamento).not.toHaveBeenCalled()
  })

  it('rejeita valorCentavos negativo com ZodError', async () => {
    await expect(
      createLancamentoForUser(USER_A, { ...baseInput, valorCentavos: -100 }),
    ).rejects.toThrow(ZodError)
    expect(repo.createLancamento).not.toHaveBeenCalled()
  })

  it('rejeita tipo inválido com ZodError', async () => {
    await expect(
      createLancamentoForUser(USER_A, { ...baseInput, tipo: 'RECEITA' as never }),
    ).rejects.toThrow(ZodError)
    expect(repo.createLancamento).not.toHaveBeenCalled()
  })

  it('rejeita descrição vazia com ZodError', async () => {
    await expect(
      createLancamentoForUser(USER_A, { ...baseInput, descricao: '' }),
    ).rejects.toThrow(ZodError)
    expect(repo.createLancamento).not.toHaveBeenCalled()
  })

  it('rejeita data em formato inválido com ZodError', async () => {
    await expect(
      createLancamentoForUser(USER_A, { ...baseInput, data: '15/04/2026' }),
    ).rejects.toThrow(ZodError)
    expect(repo.createLancamento).not.toHaveBeenCalled()
  })

  it('deriva source=manual por padrão', async () => {
    vi.mocked(repo.createLancamento).mockResolvedValue(mockLancamento as never)
    await createLancamentoForUser(USER_A, baseInput)
    expect(repo.createLancamento).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ source: 'manual' }),
    )
  })

  it('deriva status=confirmada por padrão', async () => {
    vi.mocked(repo.createLancamento).mockResolvedValue(mockLancamento as never)
    await createLancamentoForUser(USER_A, baseInput)
    expect(repo.createLancamento).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ status: 'confirmada' }),
    )
  })
})

// ─── updateLancamentoForUser ──────────────────────────────────────────────────

describe('updateLancamentoForUser', () => {
  it('atualiza com sucesso e retorna registro atualizado', async () => {
    const updated = { ...mockLancamento, descricao: 'Salário atualizado' }
    vi.mocked(repo.updateLancamento).mockResolvedValue({ count: 1 })
    vi.mocked(repo.findLancamentoById).mockResolvedValue(updated as never)

    const result = await updateLancamentoForUser(USER_A, LANCAMENTO_ID, {
      descricao: 'Salário atualizado',
    })

    expect(repo.updateLancamento).toHaveBeenCalledWith(USER_A, LANCAMENTO_ID, expect.any(Object))
    expect(repo.findLancamentoById).toHaveBeenCalledWith(USER_A, LANCAMENTO_ID)
    expect(result).toEqual(updated)
  })

  it('lança NotFoundOrForbiddenError quando count=0 (outro usuário)', async () => {
    vi.mocked(repo.updateLancamento).mockResolvedValue({ count: 0 })

    await expect(
      updateLancamentoForUser(USER_B, LANCAMENTO_ID, { descricao: 'Hackeado' }),
    ).rejects.toThrow(NotFoundOrForbiddenError)

    // Não deve buscar o registro quando a atualização falhou por isolamento
    expect(repo.findLancamentoById).not.toHaveBeenCalled()
  })

  it('lança ZodError para input vazio (sem campos a atualizar)', async () => {
    await expect(
      updateLancamentoForUser(USER_A, LANCAMENTO_ID, {}),
    ).rejects.toThrow(ZodError)
    expect(repo.updateLancamento).not.toHaveBeenCalled()
  })

  it('rejeita valorCentavos = 0 na atualização', async () => {
    await expect(
      updateLancamentoForUser(USER_A, LANCAMENTO_ID, { valorCentavos: 0 }),
    ).rejects.toThrow(ZodError)
    expect(repo.updateLancamento).not.toHaveBeenCalled()
  })
})

// ─── deleteLancamentoForUser ──────────────────────────────────────────────────

describe('deleteLancamentoForUser', () => {
  it('deleta com sucesso quando lançamento pertence ao usuário', async () => {
    vi.mocked(repo.deleteLancamento).mockResolvedValue({ count: 1 })

    await expect(
      deleteLancamentoForUser(USER_A, LANCAMENTO_ID),
    ).resolves.toBeUndefined()

    expect(repo.deleteLancamento).toHaveBeenCalledWith(USER_A, LANCAMENTO_ID)
  })

  it('lança NotFoundOrForbiddenError quando lançamento não pertence ao usuário', async () => {
    vi.mocked(repo.deleteLancamento).mockResolvedValue({ count: 0 })

    await expect(
      deleteLancamentoForUser(USER_B, LANCAMENTO_ID),
    ).rejects.toThrow(NotFoundOrForbiddenError)
  })
})

// ─── listLancamentosForUser ───────────────────────────────────────────────────

describe('listLancamentosForUser', () => {
  it('repassa filtros válidos para o repository com defaults', async () => {
    const mockResult = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
    vi.mocked(repo.listLancamentosByUser).mockResolvedValue(mockResult as never)

    const result = await listLancamentosForUser(USER_A, { mes: '2026-04' })

    expect(repo.listLancamentosByUser).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ mes: '2026-04', page: 1, pageSize: 20 }),
    )
    expect(result).toEqual(mockResult)
  })

  it('usa paginação fornecida', async () => {
    const mockResult = { items: [], total: 0, page: 2, pageSize: 10, totalPages: 0 }
    vi.mocked(repo.listLancamentosByUser).mockResolvedValue(mockResult as never)

    await listLancamentosForUser(USER_A, { page: 2, pageSize: 10 })

    expect(repo.listLancamentosByUser).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ page: 2, pageSize: 10 }),
    )
  })

  it('lança ZodError para pageSize acima de 100', async () => {
    await expect(
      listLancamentosForUser(USER_A, { pageSize: 200 }),
    ).rejects.toThrow(ZodError)
    expect(repo.listLancamentosByUser).not.toHaveBeenCalled()
  })
})

// ─── getLancamentosSummaryForUser ─────────────────────────────────────────────

describe('getLancamentosSummaryForUser', () => {
  it('retorna zeros quando não há lançamentos', async () => {
    vi.mocked(repo.getLancamentosForFinancialSnapshot).mockResolvedValue([])

    const summary = await getLancamentosSummaryForUser(USER_A, '2026-04')

    expect(summary.competenciaAt).toBe('2026-04')
    expect(summary.totalIncome).toBe(0)
    expect(summary.totalExpense).toBe(0)
    expect(summary.balance).toBe(0)
    expect(summary.savingsRate).toBe(0)
    expect(summary.totalLancamentos).toBe(0)
  })

  it('calcula balance = income - expense - aportes + resgates via finance engine', async () => {
    vi.mocked(repo.getLancamentosForFinancialSnapshot).mockResolvedValue([
      { valorCentavos: 1_000_000, tipo: 'income',   metaJson: null },
      { valorCentavos:   300_000, tipo: 'expense',  metaJson: null },
      { valorCentavos:   200_000, tipo: 'investment_aporte', metaJson: null },
      { valorCentavos:    50_000, tipo: 'investment_resgate', metaJson: null },
    ] as never)

    const summary = await getLancamentosSummaryForUser(USER_A, '2026-04')

    // 1.000.000 - 300.000 - 200.000 + 50.000 = 550.000
    expect(summary.totalIncome).toBe(1_000_000)
    expect(summary.totalExpense).toBe(300_000)
    expect(summary.balance).toBe(550_000)
    expect(summary.totalLancamentos).toBe(4)
  })

  it('RAS não entra no balance operacional', async () => {
    vi.mocked(repo.getLancamentosForFinancialSnapshot).mockResolvedValue([
      { valorCentavos: 1_000_000, tipo: 'income', metaJson: null },
      { valorCentavos:    78_321, tipo: 'ras',    metaJson: null },
    ] as never)

    const summary = await getLancamentosSummaryForUser(USER_A, '2026-04')

    expect(summary.totalRas).toBe(78_321)
    expect(summary.balance).toBe(1_000_000) // RAS não subtrai
  })

  it('calcula taxa de poupança corretamente', async () => {
    vi.mocked(repo.getLancamentosForFinancialSnapshot).mockResolvedValue([
      { valorCentavos: 1_000_000, tipo: 'income',  metaJson: null },
      { valorCentavos:   700_000, tipo: 'expense', metaJson: null },
    ] as never)

    const summary = await getLancamentosSummaryForUser(USER_A, '2026-04')

    expect(summary.savingsRate).toBe(30) // 300k / 1M = 30%
  })

  it('filtra apenas lançamentos do usuário solicitante', async () => {
    vi.mocked(repo.getLancamentosForFinancialSnapshot).mockResolvedValue([])

    await getLancamentosSummaryForUser(USER_A, '2026-04')

    expect(repo.getLancamentosForFinancialSnapshot).toHaveBeenCalledWith(USER_A, '2026-04')
    // Garantia: USER_B nunca foi passado
    expect(repo.getLancamentosForFinancialSnapshot).not.toHaveBeenCalledWith(USER_B, expect.any(String))
  })
})
