// Investment Engine - pure investment position rules.
// No I/O, no Prisma, no UI. Monetary values are integer centavos.
// Quantities are decimal strings parsed to fixed-scale bigint units.

const ZERO = BigInt(0)
const TEN_THOUSAND = BigInt(10000)
const QUANTITY_SCALE = BigInt(100000000)
const MAX_DECIMAL_PLACES = 8

export type InvestmentOperationType = 'compra' | 'venda' | 'rendimento' | 'dividendo' | 'juros' | 'ajuste'
export type InvestmentOperationStatus = 'confirmada' | 'cancelada'

export interface InvestmentOperation {
  tipo: InvestmentOperationType | string
  quantidadeDecimal?: string | null
  valorTotalCentavos: number
  taxasCentavos?: number | null
  status?: InvestmentOperationStatus | string | null
}

export interface InvestmentPosition {
  quantidadeAtual: string
  custoTotalCentavos: number
  precoMedioCentavos: number
}

export interface InvestmentSaleResult extends InvestmentPosition {
  custoBaixadoCentavos: number
  resultadoRealizadoCentavos: number
}

export interface InvestmentSummary extends InvestmentPosition {
  valorAtualCentavos: number
  resultadoNaoRealizadoCentavos: number
  rentabilidadePercentual: number
}

export function calcularPosicao(operacoes: InvestmentOperation[]): InvestmentPosition {
  return operacoes.reduce<InvestmentPosition>((position, operacao) => {
    if (operacao.status === 'cancelada') return position

    if (operacao.tipo === 'compra') return aplicarCompra(position, operacao)
    if (operacao.tipo === 'venda') return aplicarVenda(position, operacao)

    return position
  }, emptyPosition())
}

export function aplicarCompra(
  position: InvestmentPosition,
  operacao: InvestmentOperation,
): InvestmentPosition {
  const quantidadeAtualUnits = parseQuantidade(position.quantidadeAtual)
  const quantidadeCompraUnits = parseQuantidadeObrigatoria(operacao.quantidadeDecimal)
  const valorTotalCentavos = validatePositiveCentavos(operacao.valorTotalCentavos, 'valorTotalCentavos')
  const taxasCentavos = validateNonNegativeCentavos(operacao.taxasCentavos ?? 0, 'taxasCentavos')

  const novaQuantidadeUnits = quantidadeAtualUnits + quantidadeCompraUnits
  const novoCustoTotalCentavos = position.custoTotalCentavos + valorTotalCentavos + taxasCentavos

  return positionFromUnits(novaQuantidadeUnits, novoCustoTotalCentavos)
}

export function aplicarVenda(
  position: InvestmentPosition,
  operacao: InvestmentOperation,
): InvestmentSaleResult {
  const quantidadeAtualUnits = parseQuantidade(position.quantidadeAtual)
  const quantidadeVendaUnits = parseQuantidadeObrigatoria(operacao.quantidadeDecimal)
  const valorTotalCentavos = validatePositiveCentavos(operacao.valorTotalCentavos, 'valorTotalCentavos')
  const taxasCentavos = validateNonNegativeCentavos(operacao.taxasCentavos ?? 0, 'taxasCentavos')

  if (quantidadeVendaUnits > quantidadeAtualUnits) {
    throw new InvestmentEngineError('Nao e possivel vender mais do que a posicao atual')
  }

  const custoBaixadoCentavos = Number(roundDiv(
    BigInt(position.custoTotalCentavos) * quantidadeVendaUnits,
    quantidadeAtualUnits,
  ))
  const novaQuantidadeUnits = quantidadeAtualUnits - quantidadeVendaUnits
  const novoCustoTotalCentavos = novaQuantidadeUnits === ZERO
    ? 0
    : position.custoTotalCentavos - custoBaixadoCentavos
  const valorLiquidoVendaCentavos = valorTotalCentavos - taxasCentavos
  const resultadoRealizadoCentavos = valorLiquidoVendaCentavos - custoBaixadoCentavos
  const nextPosition = positionFromUnits(novaQuantidadeUnits, novoCustoTotalCentavos)

  return {
    ...nextPosition,
    custoBaixadoCentavos,
    resultadoRealizadoCentavos,
  }
}

export function calcularResumo(
  operacoes: InvestmentOperation[],
  precoAtualCentavos?: number | null,
): InvestmentSummary {
  const position = calcularPosicao(operacoes)
  const quantidadeUnits = parseQuantidade(position.quantidadeAtual)
  const valorAtualCentavos = precoAtualCentavos == null
    ? position.custoTotalCentavos
    : Number(roundDiv(
        quantidadeUnits * BigInt(validateNonNegativeCentavos(precoAtualCentavos, 'precoAtualCentavos')),
        QUANTITY_SCALE,
      ))
  const resultadoNaoRealizadoCentavos = valorAtualCentavos - position.custoTotalCentavos
  const rentabilidadeBasisPoints = position.custoTotalCentavos > 0
    ? signedRoundDiv(BigInt(resultadoNaoRealizadoCentavos) * TEN_THOUSAND, BigInt(position.custoTotalCentavos))
    : ZERO

  return {
    ...position,
    valorAtualCentavos,
    resultadoNaoRealizadoCentavos,
    rentabilidadePercentual: Number(rentabilidadeBasisPoints) / 100,
  }
}

function emptyPosition(): InvestmentPosition {
  return {
    quantidadeAtual: '0',
    custoTotalCentavos: 0,
    precoMedioCentavos: 0,
  }
}

function positionFromUnits(quantidadeUnits: bigint, custoTotalCentavos: number): InvestmentPosition {
  return {
    quantidadeAtual: formatQuantidade(quantidadeUnits),
    custoTotalCentavos,
    precoMedioCentavos: quantidadeUnits === ZERO
      ? 0
      : Number(roundDiv(BigInt(custoTotalCentavos) * QUANTITY_SCALE, quantidadeUnits)),
  }
}

function parseQuantidadeObrigatoria(value: string | null | undefined): bigint {
  const quantidadeUnits = parseQuantidade(value)
  if (quantidadeUnits <= ZERO) {
    throw new InvestmentEngineError('quantidadeDecimal deve ser maior que zero')
  }
  return quantidadeUnits
}

function parseQuantidade(value: string | null | undefined): bigint {
  if (value == null || value === '') return ZERO
  const normalized = value.trim().replace(',', '.')
  const match = /^(\d+)(?:\.(\d{1,8}))?$/.exec(normalized)
  if (!match) {
    throw new InvestmentEngineError('quantidadeDecimal invalida')
  }

  const integerPart = BigInt(match[1])
  const decimalPart = (match[2] ?? '').padEnd(MAX_DECIMAL_PLACES, '0')
  return integerPart * QUANTITY_SCALE + BigInt(decimalPart || '0')
}

function formatQuantidade(units: bigint): string {
  const integerPart = units / QUANTITY_SCALE
  const decimalUnits = units % QUANTITY_SCALE
  if (decimalUnits === ZERO) return integerPart.toString()

  const decimalPart = decimalUnits
    .toString()
    .padStart(MAX_DECIMAL_PLACES, '0')
    .replace(/0+$/, '')

  return `${integerPart.toString()}.${decimalPart}`
}

function validatePositiveCentavos(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvestmentEngineError(`${field} deve ser inteiro em centavos e maior que zero`)
  }
  return value
}

function validateNonNegativeCentavos(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvestmentEngineError(`${field} deve ser inteiro em centavos e maior ou igual a zero`)
  }
  return value
}

function roundDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= ZERO) throw new InvestmentEngineError('divisao invalida')
  return (numerator + denominator / BigInt(2)) / denominator
}

function signedRoundDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= ZERO) throw new InvestmentEngineError('divisao invalida')
  if (numerator < ZERO) return -roundDiv(-numerator, denominator)
  return roundDiv(numerator, denominator)
}

export class InvestmentEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvestmentEngineError'
  }
}
