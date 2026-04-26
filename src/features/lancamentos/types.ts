// ─── Lançamentos Domain Types ─────────────────────────────────────────────────

export type TipoLancamento =
  | 'income'
  | 'expense'
  | 'ras'
  | 'investment_aporte'
  | 'investment_resgate'
  | 'transfer'

export type StatusLancamento = 'pendente' | 'confirmada'
export type SourceLancamento = 'manual' | 'recorrente' | 'parcelado'

// ─── DTO — what the API returns to the client ─────────────────────────────────

export interface LancamentoDTO {
  id: string
  userId: string
  contaId: string
  descricao: string
  tipo: TipoLancamento
  categoria: string
  valorCentavos: number
  data: string                     // YYYY-MM-DD
  competenciaAt: string            // YYYY-MM
  source: SourceLancamento
  status: StatusLancamento
  metaJson?: Record<string, unknown> | null
  parcelas?: number | null
  parcelaAtual?: number | null
  parentId?: string | null
  recorrenciaId?: string | null
  createdAt: string
  updatedAt: string
  conta?: { id: string; nome: string; tipo: string }
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateLancamentoInput {
  contaId: string
  descricao: string
  tipo: TipoLancamento
  categoria: string
  valorCentavos: number
  data: string                     // YYYY-MM-DD
  competenciaAt?: string           // YYYY-MM — defaults to data's month
  source?: SourceLancamento
  status?: StatusLancamento
  metaJson?: Record<string, unknown>
}

export interface UpdateLancamentoInput {
  descricao?: string
  tipo?: TipoLancamento
  categoria?: string
  valorCentavos?: number
  data?: string
  competenciaAt?: string
  status?: StatusLancamento
  metaJson?: Record<string, unknown> | null
}

export interface LancamentoFilters {
  mes?: string                     // YYYY-MM — filters by competenciaAt
  tipo?: TipoLancamento | 'all'
  contaId?: string
  categoria?: string
  status?: StatusLancamento | 'all'
  page?: number | string
  pageSize?: number | string
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface LancamentoSummaryDTO {
  competenciaAt: string
  totalIncome: number              // centavos
  totalExpense: number             // centavos
  totalRas: number                 // centavos
  totalAportes: number             // centavos
  totalResgates: number            // centavos
  balance: number                  // centavos — saldo operacional
  savingsRate: number              // 0–100
  totalLancamentos: number
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const TIPO_LABELS: Record<TipoLancamento, string> = {
  income:              'Receita',
  expense:             'Despesa',
  ras:                 'RAS',
  investment_aporte:   'Aporte',
  investment_resgate:  'Resgate',
  transfer:            'Transferência',
}

export const TIPO_COLORS: Record<TipoLancamento, string> = {
  income:              '#22c55e',
  expense:             '#ef4444',
  ras:                 '#3b82f6',
  investment_aporte:   '#8b5cf6',
  investment_resgate:  '#a78bfa',
  transfer:            '#6b7280',
}

export const TIPOS_LANCAMENTO = [
  'income', 'expense', 'ras', 'investment_aporte', 'investment_resgate', 'transfer',
] as const satisfies TipoLancamento[]

export const STATUS_LANCAMENTO = ['pendente', 'confirmada'] as const satisfies StatusLancamento[]
export const SOURCE_LANCAMENTO = ['manual', 'recorrente', 'parcelado'] as const satisfies SourceLancamento[]
