import type { TipoLancamento } from '@/features/lancamentos/types'
import type {
  CreditCardDashboardInvoiceItem,
  CreditCardDashboardSummaryDTO,
} from '@/features/cartao/types'

export interface RecentTransactionItem {
  id: string
  descricao: string
  tipo: TipoLancamento
  categoria: string
  valorCentavos: number
  data: Date | string
  status: string
  conta?: { id: string; nome: string; tipo: string } | null
}

export interface RasItem {
  data: string
  horaInicio: string
  local: string
  duracao: number
  status?: string
}

export interface EscalaItem {
  data: string
  horaInicio: string
  horaFim: string
  tipoTurno: string
  localServico: string | null
  diasAte: number
}

export interface DashboardSummaryDTO {
  periodo: string
  periodoLabel: string
  saldoOperacionalCentavos: number
  saldoAnteriorCentavos: number
  historicoSaldos: Array<{ mes: string; valor: number }>
  totalReceitasCentavos: number
  totalDespesasCentavos: number
  totalRasCentavos: number
  totalAportesCentavos: number
  totalResgatesCentavos: number
  patrimonioInvestidoCentavos: number
  taxaPoupancaPercentual: number
  lancamentosRecentes: RecentTransactionItem[]
  hasLancamentos: boolean
  cartao: CreditCardDashboardSummaryDTO
  totalRasHoras?: number
  proximosRas?: RasItem[]
  rasAReceberCentavos?: number
  rasHorasPendentes?: number
  rasHorasConfirmadas?: number
  proximaEscala?: EscalaItem | null
  recorrenciasVencidasCount?: number
  recorrenciasPrevistasMesCentavos?: number
  assinaturasVencidasCount?: number
  assinaturasPrevistasMesCentavos?: number
}

export type { CreditCardDashboardInvoiceItem, CreditCardDashboardSummaryDTO }
