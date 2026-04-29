export type FaturaCartaoStatus = 'aberta' | 'fechada' | 'paga' | 'vencida' | 'cancelada'
export type CompraCartaoStatus = 'ativa' | 'cancelada'
export type ParcelaCartaoStatus = 'prevista' | 'lancada' | 'paga' | 'cancelada'
export type PagamentoFaturaStatus = 'confirmado' | 'estornado'

export interface CreateCompraCartaoInput {
  contaId: string
  descricao: string
  categoriaId?: string | null
  categoria: string
  valorTotalCentavos: number
  dataCompra: string
  quantidadeParcelas: number
}

export interface FaturaCartaoFilters {
  contaId?: string
  status?: FaturaCartaoStatus
  competencia?: string
}

export interface PagarFaturaInput {
  faturaCartaoId: string
  contaPagamentoId: string
  valorCentavos: number
  dataPagamento: string
}

export interface CartaoContaDTO {
  id: string
  nome: string
  tipo: string
}

export interface FaturaCartaoDTO {
  id: string
  userId: string
  contaId: string
  competencia: string
  dataFechamento: string
  dataVencimento: string
  status: FaturaCartaoStatus
  totalCentavos: number
  createdAt: string
  updatedAt: string
  conta?: CartaoContaDTO
  _count?: {
    parcelas: number
    pagamentos: number
  }
}

export interface CompraCartaoDTO {
  id: string
  userId: string
  contaId: string
  categoriaId?: string | null
  categoria: string
  descricao: string
  valorTotalCentavos: number
  dataCompra: string
  quantidadeParcelas: number
  status: CompraCartaoStatus
  createdAt: string
  updatedAt: string
}

export interface ParcelaCartaoDTO {
  id: string
  userId: string
  compraCartaoId: string
  faturaCartaoId: string
  lancamentoId?: string | null
  numero: number
  totalParcelas: number
  valorCentavos: number
  competencia: string
  dataVencimento: string
  status: ParcelaCartaoStatus
  createdAt: string
  updatedAt: string
  compraCartao: CompraCartaoDTO
  lancamento?: {
    id: string
    descricao: string
    tipo: string
    categoria: string
    valorCentavos: number
    data: string
    competenciaAt?: string | null
    source: string
    status: string
  } | null
}

export interface PagamentoFaturaDTO {
  id: string
  userId: string
  faturaCartaoId: string
  contaPagamentoId: string
  lancamentoId?: string | null
  valorCentavos: number
  dataPagamento: string
  status: PagamentoFaturaStatus
  createdAt: string
  updatedAt: string
  contaPagamento?: CartaoContaDTO
}

export interface FaturaCartaoDetalheDTO extends FaturaCartaoDTO {
  parcelas: ParcelaCartaoDTO[]
  pagamentos: PagamentoFaturaDTO[]
}

export interface CreditCardDashboardInvoiceItem {
  id: string
  contaId: string
  contaNome: string
  competencia: string
  dataVencimento: Date | string
  status: string
  totalCentavos: number
}

export interface CreditCardDashboardSummaryDTO {
  totalCartoes: number
  totalLimiteCentavos: number
  limiteUsadoCentavos: number
  limiteDisponivelCentavos: number
  totalFaturasAbertas: number
  valorFaturasAbertasCentavos: number
  proximaFatura: CreditCardDashboardInvoiceItem | null
  faturasProximas: CreditCardDashboardInvoiceItem[]
}

export const STATUS_FATURA_CARTAO = [
  'aberta',
  'fechada',
  'paga',
  'vencida',
  'cancelada',
] as const satisfies FaturaCartaoStatus[]

export const STATUS_COMPRA_CARTAO = ['ativa', 'cancelada'] as const satisfies CompraCartaoStatus[]
export const STATUS_PARCELA_CARTAO = [
  'prevista',
  'lancada',
  'paga',
  'cancelada',
] as const satisfies ParcelaCartaoStatus[]
export const STATUS_PAGAMENTO_FATURA = [
  'confirmado',
  'estornado',
] as const satisfies PagamentoFaturaStatus[]
