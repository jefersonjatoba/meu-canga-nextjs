import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/assinatura.repository', () => ({
  runInTransaction: vi.fn(),
  listAssinaturasByUser: vi.fn(),
  listActiveAssinaturasForProcessing: vi.fn(),
  findAssinaturaById: vi.fn(),
  findAssinaturaByIdTx: vi.fn(),
  findContaForAssinatura: vi.fn(),
  findCategoriaForAssinatura: vi.fn(),
  createAssinatura: vi.fn(),
  updateAssinatura: vi.fn(),
  toggleAssinaturaAtiva: vi.fn(),
  updateAssinaturaCobrancaState: vi.fn(),
  findCompraByAssinaturaCompetencia: vi.fn(),
}))

vi.mock('@/server/repositories/cartao.repository', () => ({
  createCompraCartao: vi.fn(),
  findOrCreateFaturaCartao: vi.fn(),
  createParcelaCartao: vi.fn(),
  createLancamentoForParcelaCartao: vi.fn(),
  linkParcelaToLancamento: vi.fn(),
  incrementFaturaTotal: vi.fn(),
}))

vi.mock('@/server/engines/card.engine', () => ({
  generateInstallments: vi.fn(),
}))

import * as repo from '@/server/repositories/assinatura.repository'
import * as cartaoRepo from '@/server/repositories/cartao.repository'
import { generateInstallments } from '@/server/engines/card.engine'
import {
  AssinaturaContaInvalidaError,
  AssinaturaContaNotFoundError,
  AssinaturaContaSemConfiguracaoError,
  AssinaturaNotFoundOrForbiddenError,
  createAssinaturaForUser,
  processarAssinaturas,
  toggleAssinaturaForUser,
} from '@/server/services/assinatura.service'

const USER_A = 'user_aaa'
const tx = { __tx: true } as never

const contaCredit = {
  id: 'conta_cartao',
  nome: 'Cartão Nubank',
  tipo: 'credit',
  diaFechamento: 15,
  diaVencimento: 22,
}

const assinaturaBase = {
  id: 'assin_111',
  userId: USER_A,
  contaId: 'conta_cartao',
  categoriaId: null,
  descricao: 'Netflix',
  categoria: 'Streaming',
  valorCentavos: 3_990,
  diaCobranca: 10,
  dataInicio: new Date('2026-01-01T00:00:00.000Z'),
  dataFim: null,
  proximaCobranca: null,
  ultimaCobranca: null,
  ultimaCompetencia: null,
  ativa: true,
  conta: contaCredit,
  categoriaRef: null,
}

const parcelaGerada = {
  numero: 1,
  totalParcelas: 1,
  valorCentavos: 3_990,
  competencia: '2026-01',
  dataFechamento: '2026-01-15',
  dataVencimento: '2026-01-22',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(repo.runInTransaction).mockImplementation(async fn => fn(tx))
  vi.mocked(repo.findContaForAssinatura).mockResolvedValue(contaCredit as never)
  vi.mocked(repo.findCategoriaForAssinatura).mockResolvedValue(null)
  vi.mocked(repo.createAssinatura).mockResolvedValue({ id: 'assin_111' } as never)
  vi.mocked(repo.findAssinaturaByIdTx).mockResolvedValue(assinaturaBase as never)
  vi.mocked(repo.toggleAssinaturaAtiva).mockResolvedValue({ count: 1 } as never)
  vi.mocked(repo.listActiveAssinaturasForProcessing).mockResolvedValue([assinaturaBase] as never)
  vi.mocked(repo.findCompraByAssinaturaCompetencia).mockResolvedValue(null)
  vi.mocked(repo.updateAssinaturaCobrancaState).mockResolvedValue({ count: 1 } as never)
  vi.mocked(generateInstallments).mockReturnValue([parcelaGerada] as never)
  vi.mocked(cartaoRepo.createCompraCartao).mockResolvedValue({ id: 'compra_111' } as never)
  vi.mocked(cartaoRepo.findOrCreateFaturaCartao).mockResolvedValue({ id: 'fatura_111' } as never)
  vi.mocked(cartaoRepo.createParcelaCartao).mockResolvedValue({ id: 'parcela_111' } as never)
  vi.mocked(cartaoRepo.createLancamentoForParcelaCartao).mockResolvedValue({ id: 'lan_111' } as never)
  vi.mocked(cartaoRepo.linkParcelaToLancamento).mockResolvedValue(undefined as never)
  vi.mocked(cartaoRepo.incrementFaturaTotal).mockResolvedValue(undefined as never)
})

// ─── createAssinaturaForUser ──────────────────────────────────────────────────

describe('createAssinaturaForUser', () => {
  it('cria assinatura em conta credit com configuração válida', async () => {
    await createAssinaturaForUser(USER_A, {
      contaId: 'conta_cartao',
      descricao: 'Netflix',
      categoria: 'Streaming',
      valorCentavos: 3_990,
      diaCobranca: 10,
      dataInicio: '2026-01-01',
    })

    expect(repo.findContaForAssinatura).toHaveBeenCalledWith(tx, USER_A, 'conta_cartao')
    expect(repo.createAssinatura).toHaveBeenCalledWith(
      tx,
      USER_A,
      expect.objectContaining({
        descricao: 'Netflix',
        valorCentavos: 3_990,
        diaCobranca: 10,
      }),
    )
  })

  it('rejeita conta que não existe', async () => {
    vi.mocked(repo.findContaForAssinatura).mockResolvedValue(null)

    await expect(createAssinaturaForUser(USER_A, {
      contaId: 'conta_inexistente',
      descricao: 'Spotify',
      categoria: 'Streaming',
      valorCentavos: 2_190,
      diaCobranca: 5,
      dataInicio: '2026-01-01',
    })).rejects.toThrow(AssinaturaContaNotFoundError)

    expect(repo.createAssinatura).not.toHaveBeenCalled()
  })

  it('rejeita conta que não é credit', async () => {
    vi.mocked(repo.findContaForAssinatura).mockResolvedValue({
      ...contaCredit,
      tipo: 'checking',
    } as never)

    await expect(createAssinaturaForUser(USER_A, {
      contaId: 'conta_corrente',
      descricao: 'Netflix',
      categoria: 'Streaming',
      valorCentavos: 3_990,
      diaCobranca: 10,
      dataInicio: '2026-01-01',
    })).rejects.toThrow(AssinaturaContaInvalidaError)

    expect(repo.createAssinatura).not.toHaveBeenCalled()
  })

  it('rejeita conta credit sem diaFechamento ou diaVencimento', async () => {
    vi.mocked(repo.findContaForAssinatura).mockResolvedValue({
      ...contaCredit,
      diaFechamento: null,
      diaVencimento: null,
    } as never)

    await expect(createAssinaturaForUser(USER_A, {
      contaId: 'conta_cartao_sem_config',
      descricao: 'Netflix',
      categoria: 'Streaming',
      valorCentavos: 3_990,
      diaCobranca: 10,
      dataInicio: '2026-01-01',
    })).rejects.toThrow(AssinaturaContaSemConfiguracaoError)
  })
})

// ─── processarAssinaturas ─────────────────────────────────────────────────────

describe('processarAssinaturas', () => {
  it('gera compra na fatura correta para competência devida', async () => {
    // hoje=2026-01-15: apenas jan-10 ≤ jan-15 → 1 competência
    const result = await processarAssinaturas(USER_A, {
      hoje: new Date('2026-01-15T00:00:00.000Z'),
    })

    expect(cartaoRepo.createCompraCartao).toHaveBeenCalledOnce()
    expect(cartaoRepo.createCompraCartao).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: USER_A,
        contaId: 'conta_cartao',
        descricao: 'Netflix',
        valorTotalCentavos: 3_990,
        assinaturaCartaoId: 'assin_111',
      }),
    )
    expect(cartaoRepo.findOrCreateFaturaCartao).toHaveBeenCalledOnce()
    expect(cartaoRepo.createParcelaCartao).toHaveBeenCalledOnce()
    expect(cartaoRepo.createLancamentoForParcelaCartao).toHaveBeenCalledOnce()
    expect(repo.updateAssinaturaCobrancaState).toHaveBeenCalledOnce()
    expect(result.comprasCriadas).toBe(1)
    expect(result.ignoradosPorDuplicidade).toBe(0)
  })

  it('não duplica quando competência já foi processada', async () => {
    vi.mocked(repo.findCompraByAssinaturaCompetencia)
      .mockResolvedValue({ id: 'compra_existente' } as never)

    const result = await processarAssinaturas(USER_A, {
      hoje: new Date('2026-02-15T00:00:00.000Z'),
    })

    expect(cartaoRepo.createCompraCartao).not.toHaveBeenCalled()
    expect(result.comprasCriadas).toBe(0)
    // hoje=2026-02-15 → jan (dia 10) e fev (dia 10) ambos são competências devidas, ambos já existem
    expect(result.ignoradosPorDuplicidade).toBe(2)
  })

  it('gera múltiplas competências em atraso', async () => {
    // Netflix desde jan/2026 — processando em abr/2026 → deve gerar jan, fev, mar
    vi.mocked(generateInstallments).mockReturnValue([parcelaGerada] as never)

    const result = await processarAssinaturas(USER_A, {
      hoje: new Date('2026-04-01T00:00:00.000Z'),
    })

    expect(cartaoRepo.createCompraCartao).toHaveBeenCalledTimes(3)
    expect(result.comprasCriadas).toBe(3)
  })

  it('respeita dataFim — não gera após encerramento', async () => {
    vi.mocked(repo.listActiveAssinaturasForProcessing).mockResolvedValue([{
      ...assinaturaBase,
      dataInicio: new Date('2026-01-01T00:00:00.000Z'),
      dataFim: new Date('2026-02-28T00:00:00.000Z'),
      diaCobranca: 10,
    }] as never)

    await processarAssinaturas(USER_A, {
      hoje: new Date('2026-05-01T00:00:00.000Z'),
    })

    // Jan e Fev apenas — não gera mar, abr, mai
    expect(cartaoRepo.createCompraCartao).toHaveBeenCalledTimes(2)
  })

  it('ignora assinaturas sem conta credit configurada', async () => {
    vi.mocked(repo.listActiveAssinaturasForProcessing).mockResolvedValue([{
      ...assinaturaBase,
      conta: { ...contaCredit, diaFechamento: null, diaVencimento: null },
    }] as never)

    const result = await processarAssinaturas(USER_A, {
      hoje: new Date('2026-02-15T00:00:00.000Z'),
    })

    expect(cartaoRepo.createCompraCartao).not.toHaveBeenCalled()
    expect(result.comprasCriadas).toBe(0)
  })

  it('executa toda a cadeia transacional corretamente', async () => {
    // hoje=2026-01-15: apenas jan-10 → 1 competência, valida toda a cadeia
    await processarAssinaturas(USER_A, {
      hoje: new Date('2026-01-15T00:00:00.000Z'),
    })

    expect(repo.runInTransaction).toHaveBeenCalledOnce()
    // Ordem: compra → fatura → parcela → lancamento → link → increment → estado
    const order = [
      cartaoRepo.createCompraCartao,
      cartaoRepo.findOrCreateFaturaCartao,
      cartaoRepo.createParcelaCartao,
      cartaoRepo.createLancamentoForParcelaCartao,
      cartaoRepo.linkParcelaToLancamento,
      cartaoRepo.incrementFaturaTotal,
      repo.updateAssinaturaCobrancaState,
    ]
    for (const fn of order) {
      expect(fn).toHaveBeenCalledOnce()
    }
  })
})

// ─── toggleAssinaturaForUser ──────────────────────────────────────────────────

describe('toggleAssinaturaForUser', () => {
  it('pausa assinatura ativa e limpa proximaCobranca', async () => {
    vi.mocked(repo.findAssinaturaByIdTx)
      .mockResolvedValueOnce({ ...assinaturaBase, ativa: true } as never)
      .mockResolvedValueOnce({ ...assinaturaBase, ativa: false, proximaCobranca: null } as never)

    const result = await toggleAssinaturaForUser(USER_A, 'assin_111')

    expect(repo.toggleAssinaturaAtiva).toHaveBeenCalledWith(
      tx,
      USER_A,
      'assin_111',
      false,
      null,
    )
    expect(result.ativa).toBe(false)
    expect(result.proximaCobranca).toBeNull()
  })

  it('reativa assinatura pausada e recalcula proximaCobranca', async () => {
    const proximaFutura = new Date('2026-05-10T00:00:00.000Z')
    vi.mocked(repo.findAssinaturaByIdTx)
      .mockResolvedValueOnce({ ...assinaturaBase, ativa: false } as never)
      .mockResolvedValueOnce({ ...assinaturaBase, ativa: true, proximaCobranca: proximaFutura } as never)

    const result = await toggleAssinaturaForUser(USER_A, 'assin_111')

    expect(repo.toggleAssinaturaAtiva).toHaveBeenCalledWith(
      tx,
      USER_A,
      'assin_111',
      true,
      expect.any(Date),
    )
    expect(result.ativa).toBe(true)
  })

  it('lança erro quando assinatura não existe ou não pertence ao usuário', async () => {
    vi.mocked(repo.findAssinaturaByIdTx).mockResolvedValue(null)

    await expect(toggleAssinaturaForUser(USER_A, 'assin_inexistente'))
      .rejects.toThrow(AssinaturaNotFoundOrForbiddenError)

    expect(repo.toggleAssinaturaAtiva).not.toHaveBeenCalled()
  })
})
