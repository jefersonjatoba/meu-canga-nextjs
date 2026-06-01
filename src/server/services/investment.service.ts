import {
  InvestmentEngineError,
  calcularPosicao,
  type InvestmentOperation,
  type InvestmentPosition,
} from '@/server/engines/investment.engine'
import * as repo from '@/server/repositories/investment.repository'

export type CriarAtivoInput = {
  nome: string
  ticker: string
  tipo: string
  moeda: string
  corretora?: string | null
}

export type RegistrarOperacaoInput = {
  ativoId: string
  contaId?: string | null
  tipo: string
  quantidadeDecimal: string
  precoUnitarioCentavos: number
  valorTotalCentavos: number
  taxasCentavos?: number | null
  dataOperacao: string | Date
}

export type InvestimentoAtivoComPosicaoDTO = {
  id: string
  userId: string
  nome: string
  ticker: string
  tipo: string
  moeda: string
  corretora: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
  posicao: InvestmentPosition
  operacoes: Array<{
    id: string
    userId: string
    ativoId: string
    contaId: string | null
    tipo: string
    quantidadeDecimal: string
    precoUnitarioCentavos: number
    valorTotalCentavos: number
    taxasCentavos: number
    dataOperacao: string
    status: string
    lancamentoId: string | null
    createdAt: string
    updatedAt: string
  }>
}

type AtivoWithOperacoes = NonNullable<Awaited<ReturnType<typeof repo.findAtivoById>>>
type Operacao = Awaited<ReturnType<typeof repo.listOperacoesByAtivo>>[number]

export async function criarAtivo(userId: string, input: CriarAtivoInput) {
  assertUserId(userId)
  const validated = validateAtivoInput(input)

  return repo.runInTransaction(tx => repo.createAtivo(tx, userId, validated))
}

export async function listarAtivos(userId: string) {
  assertUserId(userId)
  return repo.listAtivos(userId)
}

export async function obterAtivoComPosicao(
  userId: string,
  ativoId: string,
): Promise<InvestimentoAtivoComPosicaoDTO> {
  assertUserId(userId)
  const ativo = await repo.findAtivoById(userId, ativoId)
  if (!ativo) throw new InvestmentAtivoNotFoundOrForbiddenError()

  return toAtivoComPosicaoDTO(ativo)
}

export async function registrarOperacao(
  userId: string,
  input: RegistrarOperacaoInput,
) {
  assertUserId(userId)
  const validated = validateOperacaoInput(input)

  await repo.runInTransaction(async tx => {
    const ativo = await repo.findAtivoByIdTx(tx, userId, validated.ativoId)
    if (!ativo) throw new InvestmentAtivoNotFoundOrForbiddenError()
    if (!ativo.ativo) throw new InvestmentAtivoInactiveError()

    if (validated.contaId) {
      const conta = await repo.findContaForInvestment(tx, userId, validated.contaId)
      if (!conta) throw new InvestmentContaNotFoundOrForbiddenError()
      if (conta.tipo === 'credit') throw new InvestmentContaCreditError()
    }

    const operacoes = await repo.listOperacoesByAtivoTx(tx, userId, validated.ativoId)
    validateOperationAgainstPosition(operacoes, validated)

    let lancamentoId: string | null = null
    if (validated.contaId) {
      const isAporte = validated.tipo === 'aporte' || validated.tipo === 'compra'
      const lancamento = await repo.createLancamentoForInvestimento(tx, userId, {
        contaId: validated.contaId,
        tipoLancamento: isAporte ? 'investment_aporte' : 'investment_resgate',
        valorCentavos: validated.valorTotalCentavos,
        dataOperacao: validated.dataOperacao,
        ativoNome: ativo.nome,
      })
      lancamentoId = lancamento.id
    }

    await repo.createOperacao(tx, userId, { ...validated, lancamentoId })
  })

  return obterAtivoComPosicao(userId, validated.ativoId)
}

export async function excluirAtivo(userId: string, ativoId: string) {
  assertUserId(userId)
  assertNonEmptyString(ativoId, 'ativoId')

  await repo.runInTransaction(async tx => {
    const ativo = await repo.findAtivoByIdTx(tx, userId, ativoId)
    if (!ativo) throw new InvestmentAtivoNotFoundOrForbiddenError()

    const temOperacoesAtivas = ativo.operacoes.some(op => op.status !== 'cancelada')
    if (temOperacoesAtivas) throw new InvestmentAtivoComOperacoesAtivasError()

    await repo.deleteAtivo(tx, userId, ativoId)
  })
}

export async function cancelarOperacao(userId: string, operacaoId: string) {
  assertUserId(userId)
  assertNonEmptyString(operacaoId, 'operacaoId')

  const ativoId = await repo.runInTransaction(async tx => {
    const operacao = await repo.findOperacaoByIdTx(tx, userId, operacaoId)
    if (!operacao) throw new InvestmentOperacaoNotFoundOrForbiddenError()
    if (operacao.status === 'cancelada') throw new InvestmentOperacaoInvalidStateError()

    const result = await repo.cancelOperacao(tx, userId, operacaoId)
    if (result.count !== 1) throw new InvestmentOperacaoNotFoundOrForbiddenError()

    if (operacao.lancamentoId) {
      await repo.cancelLancamentoById(tx, operacao.lancamentoId)
    }

    return operacao.ativoId
  })

  return obterAtivoComPosicao(userId, ativoId)
}

function validateOperationAgainstPosition(
  operacoes: Operacao[],
  input: ReturnType<typeof validateOperacaoInput>,
) {
  try {
    calcularPosicao([
      ...operacoes.map(toEngineOperation),
      toEngineOperation(input),
    ])
  } catch (error) {
    if (error instanceof InvestmentEngineError) {
      throw new InvestmentOperacaoInvalidError(error.message)
    }
    throw error
  }
}

function toAtivoComPosicaoDTO(ativo: AtivoWithOperacoes): InvestimentoAtivoComPosicaoDTO {
  const operacoesOrdenadas = [...ativo.operacoes].sort((a, b) => {
    const byDate = a.dataOperacao.getTime() - b.dataOperacao.getTime()
    if (byDate !== 0) return byDate
    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  return {
    id: ativo.id,
    userId: ativo.userId,
    nome: ativo.nome,
    ticker: ativo.ticker,
    tipo: ativo.tipo,
    moeda: ativo.moeda,
    corretora: ativo.corretora,
    ativo: ativo.ativo,
    createdAt: ativo.createdAt.toISOString(),
    updatedAt: ativo.updatedAt.toISOString(),
    posicao: calcularPosicao(operacoesOrdenadas.map(toEngineOperation)),
    operacoes: operacoesOrdenadas.map(operacao => ({
      id: operacao.id,
      userId: operacao.userId,
      ativoId: operacao.ativoId,
      contaId: operacao.contaId,
      tipo: operacao.tipo,
      quantidadeDecimal: operacao.quantidadeDecimal,
      precoUnitarioCentavos: operacao.precoUnitarioCentavos,
      valorTotalCentavos: operacao.valorTotalCentavos,
      taxasCentavos: operacao.taxasCentavos,
      dataOperacao: operacao.dataOperacao.toISOString(),
      status: operacao.status,
      lancamentoId: operacao.lancamentoId,
      createdAt: operacao.createdAt.toISOString(),
      updatedAt: operacao.updatedAt.toISOString(),
    })),
  }
}

function toEngineOperation(operacao: {
  tipo: string
  quantidadeDecimal: string
  valorTotalCentavos: number
  taxasCentavos?: number | null
  status?: string | null
}): InvestmentOperation {
  return {
    tipo: operacao.tipo,
    quantidadeDecimal: operacao.quantidadeDecimal,
    valorTotalCentavos: operacao.valorTotalCentavos,
    taxasCentavos: operacao.taxasCentavos ?? 0,
    status: operacao.status ?? 'confirmada',
  }
}

function validateAtivoInput(input: CriarAtivoInput): CriarAtivoInput {
  return {
    nome: assertNonEmptyString(input.nome, 'nome', 120),
    ticker: assertNonEmptyString(input.ticker, 'ticker', 24).toUpperCase(),
    tipo: assertNonEmptyString(input.tipo, 'tipo', 40),
    moeda: assertNonEmptyString(input.moeda, 'moeda', 12).toUpperCase(),
    corretora: input.corretora ? assertNonEmptyString(input.corretora, 'corretora', 80) : null,
  }
}

function validateOperacaoInput(input: RegistrarOperacaoInput) {
  const tipo = assertNonEmptyString(input.tipo, 'tipo', 40)
  if (!['compra', 'venda', 'aporte', 'resgate'].includes(tipo)) {
    throw new InvestmentOperacaoInvalidError('Tipo de operacao invalido')
  }

  return {
    ativoId: assertNonEmptyString(input.ativoId, 'ativoId'),
    contaId: input.contaId ? assertNonEmptyString(input.contaId, 'contaId') : null,
    tipo,
    quantidadeDecimal: assertNonEmptyString(input.quantidadeDecimal, 'quantidadeDecimal', 40),
    precoUnitarioCentavos: assertPositiveInteger(input.precoUnitarioCentavos, 'precoUnitarioCentavos'),
    valorTotalCentavos: assertPositiveInteger(input.valorTotalCentavos, 'valorTotalCentavos'),
    taxasCentavos: assertNonNegativeInteger(input.taxasCentavos ?? 0, 'taxasCentavos'),
    dataOperacao: parseDate(input.dataOperacao),
  }
}

function assertUserId(userId: string) {
  assertNonEmptyString(userId, 'userId')
}

function assertNonEmptyString(value: string, field: string, maxLength = 200): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvestmentValidationError(`${field} obrigatorio`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLength) {
    throw new InvestmentValidationError(`${field} excede o limite de caracteres`)
  }
  return trimmed
}

function assertPositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvestmentValidationError(`${field} deve ser inteiro em centavos e maior que zero`)
  }
  return value
}

function assertNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvestmentValidationError(`${field} deve ser inteiro em centavos e maior ou igual a zero`)
  }
  return value
}

function parseDate(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new InvestmentValidationError('dataOperacao invalida')
  }
  return date
}

export class InvestmentValidationError extends Error {
  readonly statusCode = 400
  constructor(message: string) {
    super(message)
    this.name = 'InvestmentValidationError'
  }
}

export class InvestmentAtivoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Ativo nao encontrado ou acesso negado')
    this.name = 'InvestmentAtivoNotFoundOrForbiddenError'
  }
}

export class InvestmentOperacaoNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Operacao de investimento nao encontrada ou acesso negado')
    this.name = 'InvestmentOperacaoNotFoundOrForbiddenError'
  }
}

export class InvestmentContaNotFoundOrForbiddenError extends Error {
  readonly statusCode = 404
  constructor() {
    super('Conta nao encontrada ou acesso negado')
    this.name = 'InvestmentContaNotFoundOrForbiddenError'
  }
}

export class InvestmentContaCreditError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Investimento nao aceita conta do tipo credit')
    this.name = 'InvestmentContaCreditError'
  }
}

export class InvestmentAtivoInactiveError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Ativo de investimento esta inativo')
    this.name = 'InvestmentAtivoInactiveError'
  }
}

export class InvestmentOperacaoInvalidError extends Error {
  readonly statusCode = 422
  constructor(message = 'Operacao de investimento invalida') {
    super(message)
    this.name = 'InvestmentOperacaoInvalidError'
  }
}

export class InvestmentAtivoComOperacoesAtivasError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Cancele todas as operações ativas antes de excluir o ativo')
    this.name = 'InvestmentAtivoComOperacoesAtivasError'
  }
}

export class InvestmentOperacaoInvalidStateError extends Error {
  readonly statusCode = 422
  constructor() {
    super('Operacao de investimento nao permite esta acao neste estado')
    this.name = 'InvestmentOperacaoInvalidStateError'
  }
}
