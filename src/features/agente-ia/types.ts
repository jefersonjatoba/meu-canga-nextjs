export type AgenteIaRole = 'user' | 'assistant'

export interface AgenteIaMessage {
  id: string
  role: AgenteIaRole
  content: string
  createdAt: string
  status?: 'streaming' | 'done' | 'error'
}

export interface AgenteIaHistoryItem {
  role: AgenteIaRole
  content: string
}

export interface AgenteIaQuickPrompt {
  id: string
  title: string
  prompt: string
  tone: 'blue' | 'violet' | 'emerald' | 'amber'
}

export interface AgenteIaSnapshot {
  periodoLabel: string
  saldoOperacionalCentavos: number
  totalReceitasCentavos: number
  totalDespesasCentavos: number
  limiteDisponivelCentavos: number
  faturaAtualCentavos: number
  metasAtivas: number
  recorrenciasAtivas: number
  rasHorasMes: number
}
