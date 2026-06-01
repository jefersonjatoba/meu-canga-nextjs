export interface AssinaturaCartaoDTO {
  id: string
  userId: string
  contaId: string
  categoriaId?: string | null
  descricao: string
  categoria: string
  valorCentavos: number
  diaCobranca: number
  dataInicio: string
  dataFim?: string | null
  proximaCobranca?: string | null
  ultimaCobranca?: string | null
  ultimaCompetencia?: string | null
  ativa: boolean
  createdAt: string
  updatedAt: string
  conta?: { id: string; nome: string; tipo: string }
  categoriaRef?: { id: string; nome: string; tipo: string } | null
}

export interface CreateAssinaturaCartaoInput {
  contaId: string
  categoriaId?: string | null
  descricao: string
  categoria: string
  valorCentavos: number
  diaCobranca: number
  dataInicio: string
  dataFim?: string | null
}

export interface UpdateAssinaturaCartaoInput {
  categoriaId?: string | null
  descricao?: string
  categoria?: string
  valorCentavos?: number
  diaCobranca?: number
  dataFim?: string | null
  ativa?: boolean
}

export interface ProcessarAssinaturasResult {
  assinaturasProcessadas: number
  comprasCriadas: number
  ignoradosPorDuplicidade: number
}
