export type InvestimentoOperacaoTipo = 'compra' | 'venda' | 'aporte' | 'resgate'
export type InvestimentoOperacaoStatus = 'confirmada' | 'cancelada'

export interface CriarAtivoInput {
  nome: string
  ticker: string
  tipo: string
  moeda: string
  corretora?: string | null
}

export interface AtualizarAtivoInput {
  nome?: string
  ticker?: string
  tipo?: string
  moeda?: string
  corretora?: string | null
  ativo?: boolean
}

export interface CriarOperacaoInput {
  ativoId: string
  contaId?: string | null
  tipo: InvestimentoOperacaoTipo
  quantidadeDecimal: string
  precoUnitarioCentavos: number
  valorTotalCentavos: number
  taxasCentavos?: number | null
  dataOperacao: string
}

export interface CancelarOperacaoInput {
  id: string
}

export interface InvestimentoAtivoDTO {
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
}

export interface InvestimentoOperacaoDTO {
  id: string
  userId: string
  ativoId: string
  contaId: string | null
  tipo: InvestimentoOperacaoTipo | string
  quantidadeDecimal: string
  precoUnitarioCentavos: number
  valorTotalCentavos: number
  taxasCentavos: number
  dataOperacao: string
  status: InvestimentoOperacaoStatus | string
  lancamentoId: string | null
  createdAt: string
  updatedAt: string
}

export interface InvestimentoPosicaoDTO {
  quantidadeAtual: string
  custoTotalCentavos: number
  precoMedioCentavos: number
}

export interface InvestimentoAtivoDetalheDTO extends InvestimentoAtivoDTO {
  posicao: InvestimentoPosicaoDTO
  operacoes: InvestimentoOperacaoDTO[]
}

export const TIPOS_OPERACAO_INVESTIMENTO = ['compra', 'venda', 'aporte', 'resgate'] as const satisfies InvestimentoOperacaoTipo[]
