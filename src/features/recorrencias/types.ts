import type { TipoLancamento } from '@/features/lancamentos/types'

export type FrequenciaRecorrencia = 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'ANUAL'

export interface RecorrenciaDTO {
  id: string
  userId: string
  contaId: string
  categoriaId?: string | null
  descricao: string
  tipo: Extract<TipoLancamento, 'income' | 'expense'>
  categoria: string
  valorCentavos: number
  frequencia: FrequenciaRecorrencia
  diaVencimento: number
  dataInicio: string
  dataFim?: string | null
  proximaExecucao?: string | null
  ultimaExecucao?: string | null
  ativa: boolean
  createdAt: string
  updatedAt: string
  conta?: { id: string; nome: string; tipo: string }
  categoriaRef?: { id: string; nome: string; tipo: string } | null
}

export interface CreateRecorrenciaInput {
  contaId: string
  categoriaId?: string | null
  descricao: string
  tipo: Extract<TipoLancamento, 'income' | 'expense'>
  categoria: string
  valorCentavos: number
  frequencia: FrequenciaRecorrencia
  diaVencimento: number
  dataInicio: string
  dataFim?: string | null
}

export interface UpdateRecorrenciaInput {
  contaId?: string
  categoriaId?: string | null
  descricao?: string
  tipo?: Extract<TipoLancamento, 'income' | 'expense'>
  categoria?: string
  valorCentavos?: number
  frequencia?: FrequenciaRecorrencia
  diaVencimento?: number
  dataInicio?: string
  dataFim?: string | null
  ativa?: boolean
}

export interface ProcessarRecorrenciasResult {
  recorrenciasProcessadas: number
  lancamentosCriados: number
  ignoradosPorDuplicidade: number
}

export const FREQUENCIAS_RECORRENCIA = [
  'MENSAL',
  'BIMESTRAL',
  'TRIMESTRAL',
  'ANUAL',
] as const satisfies FrequenciaRecorrencia[]

export const FREQUENCIA_LABELS: Record<FrequenciaRecorrencia, string> = {
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  ANUAL: 'Anual',
}
