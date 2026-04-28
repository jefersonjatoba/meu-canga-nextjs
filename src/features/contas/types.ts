export type TipoConta = 'checking' | 'savings' | 'credit' | 'investment' | 'wallet' | 'custom'

export interface ContaDTO {
  id: string
  nome: string
  tipo: TipoConta
  banco?: string | null
  cor?: string | null
  saldoCentavos: number
  ativa: boolean
  createdAt: string
}

export interface CreateContaInput {
  nome: string
  tipo: TipoConta
  banco?: string
  cor?: string
  saldoCentavos?: number
}

export interface UpdateContaInput {
  nome?: string
  tipo?: TipoConta
  banco?: string | null
  cor?: string | null
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
