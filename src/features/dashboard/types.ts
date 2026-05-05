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
  data: string                  // YYYY-MM-DD
  horaInicio: string            // HH:mm
  horaFim: string               // HH:mm
  tipoTurno: string             // plantao | sobreaviso | extra | folga | ferias
  localServico: string | null
  diasAte: number               // 0 = hoje, 1 = amanhã, etc
}

export interface DashboardSummaryDTO {
  periodo: string                     // YYYY-MM
  periodoLabel: string                // "Abril 2026"
  saldoOperacionalCentavos: number    // centavos
  totalReceitasCentavos: number       // centavos
  totalDespesasCentavos: number       // centavos
  totalRasCentavos: number            // centavos
  totalAportesCentavos: number        // centavos
  totalResgatesCentavos: number       // centavos
  patrimonioInvestidoCentavos: number // centavos
  taxaPoupancaPercentual: number      // 0–100
  lancamentosRecentes: RecentTransactionItem[]
  hasLancamentos: boolean
  cartao: CreditCardDashboardSummaryDTO
  totalRasHoras?: number              // horas RAS do mês
  proximosRas?: RasItem[]             // próximos RAS agendados
  rasAReceberCentavos?: number        // RAS pendente/realizado não confirmado
  rasHorasPendentes?: number          // horas de RAS a confirmar
  rasHorasConfirmadas?: number        // horas de RAS já confirmadas
  proximaEscala?: EscalaItem | null   // próximo turno agendado
}

export type { CreditCardDashboardInvoiceItem, CreditCardDashboardSummaryDTO }
