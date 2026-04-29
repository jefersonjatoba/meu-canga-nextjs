import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/cartao.repository', () => ({
  runInTransaction: vi.fn(),
  findContaByIdForUser: vi.fn(),
  findCategoriaByIdForUser: vi.fn(),
  createCompraCartao: vi.fn(),
  findOrCreateFaturaCartao: vi.fn(),
  incrementFaturaTotal: vi.fn(),
  createParcelaCartao: vi.fn(),
  createLancamentoForParcelaCartao: vi.fn(),
  linkParcelaToLancamento: vi.fn(),
  findCompraCartaoById: vi.fn(),
  listFaturasByUser: vi.fn(),
  findFaturaById: vi.fn(),
  findFaturaByIdForUpdate: vi.fn(),
  createPagamentoFatura: vi.fn(),
  sumPagamentosConfirmados: vi.fn(),
  updateFaturaStatus: vi.fn(),
  listCreditCardAccountsForDashboard: vi.fn(),
  listOpenFaturasForDashboard: vi.fn(),
}))

import * as repo from '@/server/repositories/cartao.repository'
import {
  CategoriaCartaoNotFoundOrForbiddenError,
  ContaCartaoInvalidaError,
  ContaCartaoNotFoundOrForbiddenError,
  ContaPagamentoInvalidaError,
  criarCompraCartao,
  listarFaturas,
  obterFatura,
  pagarFatura,
  getCreditCardDashboardSummary,
} from '@/server/services/cartao.service'

const USER_A = 'user_aaa'
const USER_B = 'user_bbb'
const CONTA_CREDIT_ID = 'conta_credit'
const CONTA_CHECKING_ID = 'conta_checking'
const CATEGORIA_ID = 'cat_111'
const COMPRA_ID = 'compra_111'
const FATURA_ID = 'fatura_111'

const tx = { __tx: true } as never

const contaCredit = {
  id: CONTA_CREDIT_ID,
  nome: 'Nubank',
  tipo: 'credit',
  diaFechamento: 10,
  diaVencimento: 20,
}

const contaChecking = {
  id: CONTA_CHECKING_ID,
  nome: 'Conta Corrente',
  tipo: 'checking',
  diaFechamento: null,
  diaVencimento: null,
}

const categoria = {
  id: CATEGORIA_ID,
  nome: 'Mercado',
  tipo: 'expense',
}

const compraInput = {
  contaId: CONTA_CREDIT_ID,
  descricao: 'Compra supermercado',
  categoriaId: CATEGORIA_ID,
  categoria: 'Manual',
  valorTotalCentavos: 10_000,
  dataCompra: '2026-04-05',
  quantidadeParcelas: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(repo.runInTransaction).mockImplementation(async fn => fn(tx))
  vi.mocked(repo.findContaByIdForUser).mockResolvedValue(contaCredit as never)
  vi.mocked(repo.findCategoriaByIdForUser).mockResolvedValue(categoria as never)
  vi.mocked(repo.createCompraCartao).mockResolvedValue({ id: COMPRA_ID } as never)
  vi.mocked(repo.findOrCreateFaturaCartao).mockResolvedValue({ id: FATURA_ID } as never)
  vi.mocked(repo.createParcelaCartao).mockImplementation(async (_tx, data) => ({
    id: `parcela_${data.numero}`,
    ...data,
  }) as never)
  vi.mocked(repo.createLancamentoForParcelaCartao).mockImplementation(async (_tx, data) => ({
    id: `lancamento_${data.numero}`,
    ...data,
  }) as never)
  vi.mocked(repo.incrementFaturaTotal).mockResolvedValue({ count: 1 } as never)
  vi.mocked(repo.linkParcelaToLancamento).mockResolvedValue({ count: 1 } as never)
  vi.mocked(repo.findCompraCartaoById).mockResolvedValue({
    id: COMPRA_ID,
    parcelas: [],
  } as never)
})

describe('criarCompraCartao', () => {
  it('cria compra a vista no credito dentro de transacao', async () => {
    await criarCompraCartao(USER_A, compraInput)

    expect(repo.runInTransaction).toHaveBeenCalledOnce()
    expect(repo.findContaByIdForUser).toHaveBeenCalledWith(tx, USER_A, CONTA_CREDIT_ID)
    expect(repo.createCompraCartao).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: USER_A,
        contaId: CONTA_CREDIT_ID,
        categoriaId: CATEGORIA_ID,
        categoria: 'Mercado',
        valorTotalCentavos: 10_000,
        quantidadeParcelas: 1,
      }),
    )
  })

  it('cria fatura, parcela e lancamento expense por parcela', async () => {
    await criarCompraCartao(USER_A, compraInput)

    expect(repo.findOrCreateFaturaCartao).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: USER_A,
        contaId: CONTA_CREDIT_ID,
        competencia: '2026-04',
      }),
    )
    expect(repo.createParcelaCartao).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: USER_A,
        compraCartaoId: COMPRA_ID,
        faturaCartaoId: FATURA_ID,
        numero: 1,
        totalParcelas: 1,
        valorCentavos: 10_000,
      }),
    )
    expect(repo.createLancamentoForParcelaCartao).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: USER_A,
        valorCentavos: 10_000,
        competenciaAt: '2026-04',
      }),
    )
    expect(vi.mocked(repo.createLancamentoForParcelaCartao).mock.calls[0][1]).toMatchObject({
      contaId: CONTA_CREDIT_ID,
      categoriaId: CATEGORIA_ID,
      categoria: 'Mercado',
      numero: 1,
      totalParcelas: 1,
    })
  })

  it('cria compra parcelada e faturas por competencia', async () => {
    await criarCompraCartao(USER_A, {
      ...compraInput,
      valorTotalCentavos: 30_000,
      quantidadeParcelas: 3,
    })

    expect(repo.findOrCreateFaturaCartao).toHaveBeenCalledTimes(3)
    expect(repo.createParcelaCartao).toHaveBeenCalledTimes(3)
    expect(repo.createLancamentoForParcelaCartao).toHaveBeenCalledTimes(3)
    expect(repo.findOrCreateFaturaCartao).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({ competencia: '2026-04' }),
    )
    expect(repo.findOrCreateFaturaCartao).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({ competencia: '2026-05' }),
    )
    expect(repo.findOrCreateFaturaCartao).toHaveBeenNthCalledWith(
      3,
      tx,
      expect.objectContaining({ competencia: '2026-06' }),
    )
  })

  it('distribui centavos corretamente entre parcelas', async () => {
    await criarCompraCartao(USER_A, {
      ...compraInput,
      valorTotalCentavos: 10_000,
      quantidadeParcelas: 3,
    })

    const valores = vi.mocked(repo.createParcelaCartao).mock.calls.map(call => call[1].valorCentavos)
    expect(valores).toEqual([3334, 3333, 3333])
  })

  it('rejeita conta que nao e credit', async () => {
    vi.mocked(repo.findContaByIdForUser).mockResolvedValue(contaChecking as never)

    await expect(criarCompraCartao(USER_A, compraInput)).rejects.toThrow(ContaCartaoInvalidaError)
    expect(repo.createCompraCartao).not.toHaveBeenCalled()
  })

  it('rejeita conta inexistente ou de outro usuario', async () => {
    vi.mocked(repo.findContaByIdForUser).mockResolvedValue(null)

    await expect(criarCompraCartao(USER_B, compraInput)).rejects.toThrow(
      ContaCartaoNotFoundOrForbiddenError,
    )
    expect(repo.createCompraCartao).not.toHaveBeenCalled()
  })

  it('rejeita categoria de outro usuario', async () => {
    vi.mocked(repo.findCategoriaByIdForUser).mockResolvedValue(null)

    await expect(criarCompraCartao(USER_A, compraInput)).rejects.toThrow(
      CategoriaCartaoNotFoundOrForbiddenError,
    )
    expect(repo.createCompraCartao).not.toHaveBeenCalled()
  })

  it('usa categoria string como fallback quando categoriaId nao foi enviado', async () => {
    await criarCompraCartao(USER_A, {
      ...compraInput,
      categoriaId: undefined,
      categoria: 'Categoria manual',
    })

    expect(repo.findCategoriaByIdForUser).not.toHaveBeenCalled()
    expect(repo.createCompraCartao).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ categoriaId: null, categoria: 'Categoria manual' }),
    )
  })

  it('propaga erro e depende da transacao para rollback atomico', async () => {
    vi.mocked(repo.createLancamentoForParcelaCartao).mockRejectedValue(new Error('falha'))

    await expect(criarCompraCartao(USER_A, compraInput)).rejects.toThrow('falha')
    expect(repo.runInTransaction).toHaveBeenCalledOnce()
    expect(repo.linkParcelaToLancamento).not.toHaveBeenCalled()
  })
})

describe('faturas', () => {
  it('lista faturas filtrando por usuario', async () => {
    vi.mocked(repo.listFaturasByUser).mockResolvedValue([] as never)

    await listarFaturas(USER_A, { contaId: CONTA_CREDIT_ID, status: 'aberta' })

    expect(repo.listFaturasByUser).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ contaId: CONTA_CREDIT_ID, status: 'aberta' }),
    )
  })

  it('obtem fatura do usuario', async () => {
    vi.mocked(repo.findFaturaById).mockResolvedValue({ id: FATURA_ID } as never)

    await expect(obterFatura(USER_A, FATURA_ID)).resolves.toEqual({ id: FATURA_ID })
    expect(repo.findFaturaById).toHaveBeenCalledWith(USER_A, FATURA_ID)
  })
})

describe('pagarFatura', () => {
  const pagamentoInput = {
    faturaCartaoId: FATURA_ID,
    contaPagamentoId: CONTA_CHECKING_ID,
    valorCentavos: 10_000,
    dataPagamento: '2026-04-20',
  }

  beforeEach(() => {
    vi.mocked(repo.findFaturaByIdForUpdate).mockResolvedValue({
      id: FATURA_ID,
      userId: USER_A,
      totalCentavos: 10_000,
      status: 'aberta',
    } as never)
    vi.mocked(repo.findContaByIdForUser).mockResolvedValue(contaChecking as never)
    vi.mocked(repo.createPagamentoFatura).mockResolvedValue({ id: 'pag_111' } as never)
    vi.mocked(repo.sumPagamentosConfirmados).mockResolvedValue(10_000)
    vi.mocked(repo.updateFaturaStatus).mockResolvedValue({ count: 1 } as never)
  })

  it('registra pagamento sem criar expense duplicado', async () => {
    await pagarFatura(USER_A, pagamentoInput)

    expect(repo.createPagamentoFatura).toHaveBeenCalledWith(tx, USER_A, pagamentoInput)
    expect(repo.createLancamentoForParcelaCartao).not.toHaveBeenCalled()
  })

  it('marca fatura como paga quando total confirmado cobre a fatura', async () => {
    await pagarFatura(USER_A, pagamentoInput)

    expect(repo.updateFaturaStatus).toHaveBeenCalledWith(tx, USER_A, FATURA_ID, 'paga')
  })

  it('rejeita conta de pagamento credit', async () => {
    vi.mocked(repo.findContaByIdForUser).mockResolvedValue(contaCredit as never)

    await expect(pagarFatura(USER_A, pagamentoInput)).rejects.toThrow(ContaPagamentoInvalidaError)
    expect(repo.createPagamentoFatura).not.toHaveBeenCalled()
  })
})

describe('getCreditCardDashboardSummary', () => {
  it('retorna zeros quando nao ha cartoes', async () => {
    vi.mocked(repo.listCreditCardAccountsForDashboard).mockResolvedValue([] as never)
    vi.mocked(repo.listOpenFaturasForDashboard).mockResolvedValue([] as never)

    const result = await getCreditCardDashboardSummary(USER_A)

    expect(result.totalCartoes).toBe(0)
    expect(result.totalLimiteCentavos).toBe(0)
    expect(result.limiteUsadoCentavos).toBe(0)
    expect(result.limiteDisponivelCentavos).toBe(0)
    expect(result.proximaFatura).toBeNull()
    expect(result.faturasProximas).toEqual([])
  })

  it('calcula faturas abertas, proxima fatura e limite disponivel', async () => {
    vi.mocked(repo.listCreditCardAccountsForDashboard).mockResolvedValue([
      { id: 'card_1', nome: 'Nubank', limiteCentavos: 500_000 },
      { id: 'card_2', nome: 'Inter', limiteCentavos: 300_000 },
    ] as never)
    vi.mocked(repo.listOpenFaturasForDashboard).mockResolvedValue([
      {
        id: 'fat_1',
        contaId: 'card_1',
        competencia: '2026-05',
        dataVencimento: new Date('2026-05-10T00:00:00Z'),
        status: 'aberta',
        totalCentavos: 120_000,
        conta: { nome: 'Nubank' },
      },
      {
        id: 'fat_2',
        contaId: 'card_2',
        competencia: '2026-06',
        dataVencimento: new Date('2026-06-10T00:00:00Z'),
        status: 'fechada',
        totalCentavos: 80_000,
        conta: { nome: 'Inter' },
      },
    ] as never)

    const result = await getCreditCardDashboardSummary(USER_A)

    expect(result.totalCartoes).toBe(2)
    expect(result.totalLimiteCentavos).toBe(800_000)
    expect(result.totalFaturasAbertas).toBe(2)
    expect(result.valorFaturasAbertasCentavos).toBe(200_000)
    expect(result.limiteUsadoCentavos).toBe(200_000)
    expect(result.limiteDisponivelCentavos).toBe(600_000)
    expect(result.proximaFatura?.id).toBe('fat_1')
    expect(result.faturasProximas).toHaveLength(2)
  })
})
