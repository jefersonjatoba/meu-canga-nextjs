export type TipoConta = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet' | 'custom'

export interface ContaDTO {
  id: string
  nome: string
  tipo: TipoConta
  banco?: string | null
  cor?: string | null
  saldoCentavos: number
  limiteCentavos?: number | null
  diaFechamento?: number | null
  diaVencimento?: number | null
  ativa: boolean
  createdAt: string
  // aggregated from lancamentos
  entradasCentavos: number
  saidasCentavos: number
  saldoAtualCentavos: number          // saldoCentavos (inicial) ± movimentações confirmadas
  // credit card only (null for non-credit)
  faturaAtualCentavos: number | null  // FaturaCartao.totalCentavos do ciclo atual
  limiteDisponivelCentavos: number | null
}

export interface CreateContaInput {
  nome: string
  tipo: TipoConta
  banco?: string
  cor?: string
  saldoCentavos?: number
  limiteCentavos?: number | null
  diaFechamento?: number | null
  diaVencimento?: number | null
}

export interface UpdateContaInput {
  nome?: string
  tipo?: TipoConta
  banco?: string | null
  cor?: string | null
  limiteCentavos?: number | null
  diaFechamento?: number | null
  diaVencimento?: number | null
  ativa?: boolean
}

export interface ContaFilters {
  ativa?: boolean
}

export const TIPO_CONTA_LABELS: Record<TipoConta, string> = {
  checking:   'Conta Corrente',
  savings:    'Poupança',
  credit:     'Cartão de Crédito',
  investment: 'Investimento',
  wallet:     'Carteira',
  custom:     'Personalizada',
}

export const TIPOS_CONTA: TipoConta[] = ['checking', 'savings', 'credit', 'investment', 'wallet', 'custom']
