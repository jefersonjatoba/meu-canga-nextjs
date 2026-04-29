export type TipoMeta = 'poupanca' | 'investimento' | 'outro'
export type StatusMeta = 'ativa' | 'pausada' | 'concluida' | 'cancelada'
export type StatusMetaAporte = 'confirmado' | 'cancelado'

export interface MetaAporteDTO {
  id: string
  userId: string
  metaId: string
  contaId?: string | null
  valorCentavos: number
  dataAporte: string
  descricao?: string | null
  status: StatusMetaAporte
  createdAt: string
  updatedAt: string
  conta?: { id: string; nome: string; tipo: string } | null
}

export interface MetaProgressoDTO {
  valorInicialCentavos: number
  aportesConfirmadosCentavos: number
  progressoCentavos: number
  valorRestanteCentavos: number
  percentual: number
}

export interface MetaDTO {
  id: string
  userId: string
  descricao: string
  categoria: string
  tipo: TipoMeta
  valorAlvoCentavos: number
  valorAtualCentavos: number
  valorInicialCentavos: number
  dataInicio: string
  dataAlvo?: string | null
  status: StatusMeta
  cor?: string | null
  icone?: string | null
  ordem: number
  createdAt: string
  updatedAt: string
  aportes: MetaAporteDTO[]
  progresso: MetaProgressoDTO
}

export interface CreateMetaInput {
  descricao: string
  tipo: TipoMeta
  valorAlvoCentavos: number
  valorInicialCentavos?: number
  dataInicio: string
  dataAlvo?: string | null
  cor?: string | null
  icone?: string | null
  ordem?: number
}

export interface UpdateMetaInput {
  descricao?: string
  tipo?: TipoMeta
  valorAlvoCentavos?: number
  valorInicialCentavos?: number
  dataInicio?: string
  dataAlvo?: string | null
  cor?: string | null
  icone?: string | null
  ordem?: number
}

export interface RegistrarMetaAporteInput {
  contaId?: string | null
  valorCentavos: number
  dataAporte: string
  descricao?: string | null
}

export const TIPOS_META = ['poupanca', 'investimento', 'outro'] as const satisfies TipoMeta[]
export const STATUS_META = ['ativa', 'pausada', 'concluida', 'cancelada'] as const satisfies StatusMeta[]
export const STATUS_META_APORTE = ['confirmado', 'cancelado'] as const satisfies StatusMetaAporte[]

export const TIPO_META_LABELS: Record<TipoMeta, string> = {
  poupanca: 'Poupanca',
  investimento: 'Investimento',
  outro: 'Outro',
}
