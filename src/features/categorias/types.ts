export type TipoCategoria = 'income' | 'expense' | 'both'

export interface CategoriaDTO {
  id: string
  nome: string
  tipo: TipoCategoria
  icone?: string | null
  cor?: string | null
  ativa: boolean
  ordem: number
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface CreateCategoriaInput {
  nome: string
  tipo: TipoCategoria
  icone?: string | null
  cor?: string | null
  ordem?: number
}

export interface UpdateCategoriaInput {
  nome?: string
  tipo?: TipoCategoria
  icone?: string | null
  cor?: string | null
  ativa?: boolean
  ordem?: number
}

export interface CategoriaFilters {
  tipo?: TipoCategoria
  includeInactive?: boolean | string
}

export const TIPOS_CATEGORIA = ['income', 'expense', 'both'] as const satisfies TipoCategoria[]

export const TIPO_CATEGORIA_LABELS: Record<TipoCategoria, string> = {
  income: 'Receita',
  expense: 'Despesa',
  both: 'Ambos',
}
