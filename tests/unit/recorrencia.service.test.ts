import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/recorrencia.repository', () => ({
  runInTransaction: vi.fn(),
  listRecorrenciasByUser: vi.fn(),
  listActiveRecorrenciasForProcessing: vi.fn(),
  findRecorrenciaById: vi.fn(),
  findRecorrenciaByIdTx: vi.fn(),
  findContaForRecorrencia: vi.fn(),
  findCategoriaForRecorrencia: vi.fn(),
  createRecorrencia: vi.fn(),
  updateRecorrencia: vi.fn(),
  toggleRecorrenciaAtiva: vi.fn(),
  findLancamentoByRecorrenciaCompetencia: vi.fn(),
  createLancamentoFromRecorrencia: vi.fn(),
  updateRecorrenciaExecutionState: vi.fn(),
}))

import * as repo from '@/server/repositories/recorrencia.repository'
import {
  ContaRecorrenciaInvalidaError,
  createRecorrenciaForUser,
  processarRecorrencias,
} from '@/server/services/recorrencia.service'

const USER_A = 'user_aaa'
const USER_B = 'user_bbb'
const tx = { __tx: true } as never

const contaChecking = {
  id: 'conta_111',
  nome: 'Conta Corrente',
  tipo: 'checking',
}

const recorrenciaBase = {
  id: 'rec_111',
  userId: USER_A,
  contaId: 'conta_111',
  categoriaId: null,
  descricao: 'Aluguel',
  tipo: 'expense',
  categoria: 'Moradia',
  valorCentavos: 150_000,
  frequencia: 'MENSAL',
  diaVencimento: 10,
  dataInicio: new Date('2026-01-01T00:00:00.000Z'),
  dataFim: null,
  ativa: true,
  ultimaExecucao: null,
  proximaExecucao: null,
  conta: contaChecking,
  categoriaRef: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(repo.runInTransaction).mockImplementation(async fn => fn(tx))
  vi.mocked(repo.findContaForRecorrencia).mockResolvedValue(contaChecking as never)
  vi.mocked(repo.findCategoriaForRecorrencia).mockResolvedValue(null)
  vi.mocked(repo.createRecorrencia).mockResolvedValue({ id: 'rec_111' } as never)
  vi.mocked(repo.listActiveRecorrenciasForProcessing).mockResolvedValue([recorrenciaBase] as never)
  vi.mocked(repo.findLancamentoByRecorrenciaCompetencia).mockResolvedValue(null)
  vi.mocked(repo.createLancamentoFromRecorrencia).mockResolvedValue({ id: 'lan_111' } as never)
  vi.mocked(repo.updateRecorrenciaExecutionState).mockResolvedValue({ count: 1 } as never)
})

describe('createRecorrenciaForUser', () => {
  it('cria recorrencia sem aceitar conta credit', async () => {
    await createRecorrenciaForUser(USER_A, {
      contaId: 'conta_111',
      descricao: 'Aluguel',
      tipo: 'expense',
      categoria: 'Moradia',
      valorCentavos: 150_000,
      frequencia: 'MENSAL',
      diaVencimento: 10,
      dataInicio: '2026-01-01',
    })

    expect(repo.findContaForRecorrencia).toHaveBeenCalledWith(tx, USER_A, 'conta_111')
    expect(repo.createRecorrencia).toHaveBeenCalledWith(
      tx,
      USER_A,
      expect.objectContaining({
        categoria: 'Moradia',
        valorCentavos: 150_000,
      }),
    )
  })

  it('rejeita recorrencia em conta de cartao', async () => {
    vi.mocked(repo.findContaForRecorrencia).mockResolvedValue({
      ...contaChecking,
      tipo: 'credit',
    } as never)

    await expect(createRecorrenciaForUser(USER_A, {
      contaId: 'cartao_111',
      descricao: 'Assinatura',
      tipo: 'expense',
      categoria: 'Servicos',
      valorCentavos: 3_000,
      frequencia: 'MENSAL',
      diaVencimento: 5,
      dataInicio: '2026-01-01',
    })).rejects.toThrow(ContaRecorrenciaInvalidaError)

    expect(repo.createRecorrencia).not.toHaveBeenCalled()
  })
})

describe('processarRecorrencias', () => {
  it('gera lancamentos vencidos ate hoje de forma transacional', async () => {
    const result = await processarRecorrencias(USER_A, {
      hoje: new Date('2026-03-15T00:00:00.000Z'),
    })

    expect(repo.runInTransaction).toHaveBeenCalledOnce()
    expect(repo.listActiveRecorrenciasForProcessing).toHaveBeenCalledWith(tx, USER_A)
    expect(repo.createLancamentoFromRecorrencia).toHaveBeenCalledTimes(3)
    expect(repo.createLancamentoFromRecorrencia).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({
        userId: USER_A,
        recorrenciaId: 'rec_111',
        competenciaAt: '2026-01',
        valorCentavos: 150_000,
      }),
    )
    expect(result.lancamentosCriados).toBe(3)
  })

  it('nao duplica quando ja existe lancamento da competencia', async () => {
    vi.mocked(repo.findLancamentoByRecorrenciaCompetencia)
      .mockResolvedValueOnce({ id: 'lan_existente' } as never)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const result = await processarRecorrencias(USER_A, {
      hoje: new Date('2026-03-15T00:00:00.000Z'),
    })

    expect(repo.createLancamentoFromRecorrencia).toHaveBeenCalledTimes(2)
    expect(result.ignoradosPorDuplicidade).toBe(1)
  })

  it('respeita dataInicio e dataFim', async () => {
    vi.mocked(repo.listActiveRecorrenciasForProcessing).mockResolvedValue([{
      ...recorrenciaBase,
      dataInicio: new Date('2026-02-20T00:00:00.000Z'),
      dataFim: new Date('2026-04-30T00:00:00.000Z'),
      diaVencimento: 15,
    }] as never)

    await processarRecorrencias(USER_A, {
      hoje: new Date('2026-06-01T00:00:00.000Z'),
    })

    const competencias = vi.mocked(repo.createLancamentoFromRecorrencia).mock.calls
      .map(call => call[1].competenciaAt)
    expect(competencias).toEqual(['2026-03', '2026-04'])
  })

  it('recorrencia inativa nao gera lancamento', async () => {
    vi.mocked(repo.listActiveRecorrenciasForProcessing).mockResolvedValue([] as never)

    const result = await processarRecorrencias(USER_A, {
      hoje: new Date('2026-03-15T00:00:00.000Z'),
    })

    expect(repo.createLancamentoFromRecorrencia).not.toHaveBeenCalled()
    expect(result.lancamentosCriados).toBe(0)
  })

  it('isola processamento por userId', async () => {
    await processarRecorrencias(USER_B, {
      hoje: new Date('2026-03-15T00:00:00.000Z'),
    })

    expect(repo.listActiveRecorrenciasForProcessing).toHaveBeenCalledWith(tx, USER_B)
    expect(repo.findLancamentoByRecorrenciaCompetencia).toHaveBeenCalledWith(
      tx,
      USER_B,
      'rec_111',
      '2026-01',
    )
  })
})
