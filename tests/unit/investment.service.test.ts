import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/investment.repository', () => ({
  runInTransaction: vi.fn(),
  createAtivo: vi.fn(),
  findAtivoById: vi.fn(),
  findAtivoByIdTx: vi.fn(),
  listAtivos: vi.fn(),
  createOperacao: vi.fn(),
  listOperacoesByAtivo: vi.fn(),
  listOperacoesByAtivoTx: vi.fn(),
  cancelOperacao: vi.fn(),
  findOperacaoByIdTx: vi.fn(),
  findContaForInvestment: vi.fn(),
  createLancamentoForInvestimento: vi.fn(),
}))

import * as repo from '@/server/repositories/investment.repository'
import {
  InvestmentContaCreditError,
  InvestmentOperacaoInvalidError,
  cancelarOperacao,
  criarAtivo,
  listarAtivos,
  obterAtivoComPosicao,
  registrarOperacao,
} from '@/server/services/investment.service'

const USER_A = 'user_aaa'
const USER_B = 'user_bbb'
const ATIVO_ID = 'ativo_111'
const OPERACAO_ID = 'operacao_111'
const CONTA_ID = 'conta_111'
const tx = { __tx: true } as never
const now = new Date('2026-04-29T00:00:00.000Z')

const ativoBase = {
  id: ATIVO_ID,
  userId: USER_A,
  nome: 'Tesouro Selic',
  ticker: 'SELIC',
  tipo: 'renda_fixa',
  moeda: 'BRL',
  corretora: 'NuInvest',
  ativo: true,
  createdAt: now,
  updatedAt: now,
}

const compraBase = {
  id: OPERACAO_ID,
  userId: USER_A,
  ativoId: ATIVO_ID,
  contaId: CONTA_ID,
  tipo: 'compra',
  quantidadeDecimal: '10',
  precoUnitarioCentavos: 1000,
  valorTotalCentavos: 10000,
  taxasCentavos: 0,
  dataOperacao: new Date('2026-04-01T00:00:00.000Z'),
  status: 'confirmada',
  lancamentoId: null,
  createdAt: now,
  updatedAt: now,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(repo.runInTransaction).mockImplementation(async fn => fn(tx))
  vi.mocked(repo.createAtivo).mockResolvedValue(ativoBase as never)
  vi.mocked(repo.listAtivos).mockResolvedValue([ativoBase] as never)
  vi.mocked(repo.findAtivoById).mockResolvedValue({
    ...ativoBase,
    operacoes: [compraBase],
  } as never)
  vi.mocked(repo.findAtivoByIdTx).mockResolvedValue({
    ...ativoBase,
    operacoes: [compraBase],
  } as never)
  vi.mocked(repo.findContaForInvestment).mockResolvedValue({
    id: CONTA_ID,
    nome: 'Conta Investimento',
    tipo: 'investment',
  } as never)
  vi.mocked(repo.listOperacoesByAtivoTx).mockResolvedValue([compraBase] as never)
  vi.mocked(repo.createOperacao).mockResolvedValue({
    ...compraBase,
    id: 'operacao_nova',
  } as never)
  vi.mocked(repo.findOperacaoByIdTx).mockResolvedValue(compraBase as never)
  vi.mocked(repo.cancelOperacao).mockResolvedValue({ count: 1 } as never)
  vi.mocked(repo.createLancamentoForInvestimento).mockResolvedValue({ id: 'lanc_111' } as never)
})

describe('investment.service', () => {
  it('cria ativo sem aceitar userId do client', async () => {
    await criarAtivo(USER_A, {
      nome: 'Itausa',
      ticker: 'itsa4',
      tipo: 'acao',
      moeda: 'brl',
      corretora: 'Clear',
    })

    expect(repo.runInTransaction).toHaveBeenCalledOnce()
    expect(repo.createAtivo).toHaveBeenCalledWith(tx, USER_A, {
      nome: 'Itausa',
      ticker: 'ITSA4',
      tipo: 'acao',
      moeda: 'BRL',
      corretora: 'Clear',
    })
  })

  it('lista ativos isolando por userId', async () => {
    await listarAtivos(USER_B)

    expect(repo.listAtivos).toHaveBeenCalledWith(USER_B)
  })

  it('registra compra validando ativo e conta do usuario', async () => {
    await registrarOperacao(USER_A, {
      ativoId: ATIVO_ID,
      contaId: CONTA_ID,
      tipo: 'compra',
      quantidadeDecimal: '2',
      precoUnitarioCentavos: 1200,
      valorTotalCentavos: 2400,
      taxasCentavos: 10,
      dataOperacao: '2026-04-10',
    })

    expect(repo.findAtivoByIdTx).toHaveBeenCalledWith(tx, USER_A, ATIVO_ID)
    expect(repo.findContaForInvestment).toHaveBeenCalledWith(tx, USER_A, CONTA_ID)
    expect(repo.createOperacao).toHaveBeenCalledWith(
      tx,
      USER_A,
      expect.objectContaining({
        ativoId: ATIVO_ID,
        contaId: CONTA_ID,
        tipo: 'compra',
        quantidadeDecimal: '2',
        valorTotalCentavos: 2400,
      }),
    )
  })

  it('registra venda usando posicao calculada pela engine', async () => {
    await registrarOperacao(USER_A, {
      ativoId: ATIVO_ID,
      tipo: 'venda',
      quantidadeDecimal: '4',
      precoUnitarioCentavos: 1500,
      valorTotalCentavos: 6000,
      dataOperacao: '2026-04-20',
    })

    expect(repo.listOperacoesByAtivoTx).toHaveBeenCalledWith(tx, USER_A, ATIVO_ID)
    expect(repo.createOperacao).toHaveBeenCalledWith(
      tx,
      USER_A,
      expect.objectContaining({
        tipo: 'venda',
        quantidadeDecimal: '4',
        valorTotalCentavos: 6000,
      }),
    )
  })

  it('bloqueia venda maior que a posicao atual', async () => {
    await expect(registrarOperacao(USER_A, {
      ativoId: ATIVO_ID,
      tipo: 'venda',
      quantidadeDecimal: '20',
      precoUnitarioCentavos: 1000,
      valorTotalCentavos: 20000,
      dataOperacao: '2026-04-20',
    })).rejects.toThrow(InvestmentOperacaoInvalidError)

    expect(repo.createOperacao).not.toHaveBeenCalled()
  })

  it('cancela operacao preservando historico', async () => {
    await cancelarOperacao(USER_A, OPERACAO_ID)

    expect(repo.findOperacaoByIdTx).toHaveBeenCalledWith(tx, USER_A, OPERACAO_ID)
    expect(repo.cancelOperacao).toHaveBeenCalledWith(tx, USER_A, OPERACAO_ID)
  })

  it('ignora operacao cancelada ao calcular posicao', async () => {
    vi.mocked(repo.findAtivoById).mockResolvedValue({
      ...ativoBase,
      operacoes: [
        compraBase,
        {
          ...compraBase,
          id: 'operacao_cancelada',
          valorTotalCentavos: 50000,
          status: 'cancelada',
        },
      ],
    } as never)

    const ativo = await obterAtivoComPosicao(USER_A, ATIVO_ID)

    expect(ativo.posicao).toEqual({
      quantidadeAtual: '10',
      custoTotalCentavos: 10000,
      precoMedioCentavos: 1000,
    })
  })

  it('bloqueia conta credit', async () => {
    vi.mocked(repo.findContaForInvestment).mockResolvedValue({
      id: 'card_111',
      nome: 'Cartao',
      tipo: 'credit',
    } as never)

    await expect(registrarOperacao(USER_A, {
      ativoId: ATIVO_ID,
      contaId: 'card_111',
      tipo: 'compra',
      quantidadeDecimal: '1',
      precoUnitarioCentavos: 1000,
      valorTotalCentavos: 1000,
      dataOperacao: '2026-04-20',
    })).rejects.toThrow(InvestmentContaCreditError)

    expect(repo.createOperacao).not.toHaveBeenCalled()
  })
})
