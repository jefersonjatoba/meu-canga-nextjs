import type { TipoLancamento } from '@/features/lancamentos/types'

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
}
