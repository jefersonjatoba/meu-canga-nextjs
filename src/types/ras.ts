// ─── RAS (Regime Adicional de Serviço) Domain Types ──────────────────────────

export type GraduacaoRas = 'SD/CB' | 'SGT/SUBTEN'
export type DuracaoRas = 6 | 8 | 12 | 24
export type TipoRas = 'voluntario' | 'compulsorio'
export type TipoVagaRas = 'titular' | 'reserva'

// ─── Price table (values in cents) ───────────────────────────────────────────
// Source: ras.config.js from MeuCanga_v1

export const RAS_PRICE_TABLE: Record<GraduacaoRas, Record<DuracaoRas, number>> = {
  'SD/CB':      { 6: 20863, 8: 27247, 12: 40015, 24: 78321 },
  'SGT/SUBTEN': { 6: 24392, 8: 31952, 12: 47074, 24: 92437 },
} as const

export function getRasPrice(graduacao: GraduacaoRas, duracao: DuracaoRas): number {
  return RAS_PRICE_TABLE[graduacao][duracao]
}

export function getRasPriceBRL(graduacao: GraduacaoRas, duracao: DuracaoRas): string {
  const cents = getRasPrice(graduacao, duracao)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function fmtBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

// ─── Status ───────────────────────────────────────────────────────────────────
// agendado → realizado → pendente → confirmado | Any → cancelado

export type StatusRas = 'agendado' | 'realizado' | 'pendente' | 'confirmado' | 'cancelado'

// ─── Location arrays — identical to v1 ras.config.js ─────────────────────────

export const RAS_LOCALS_BPM: readonly string[] = [
  '1º BPM - São Gonçalo',
  '2º BPM - Botafogo',
  '3º BPM - Méier',
  '4º BPM - São Cristóvão',
  '5º BPM - Gamboa (Centro)',
  '6º BPM - Tijuca',
  '7º BPM - São Gonçalo',
  '8º BPM - Campos',
  '9º BPM - Rocha Miranda',
  '10º BPM - Barra do Piraí',
  '11º BPM - Nova Friburgo',
  '12º BPM - Niterói',
  '14º BPM - Bangu',
  '15º BPM - Duque de Caxias',
  '16º BPM - Olaria',
  '17º BPM - Ilha do Governador',
  '18º BPM - Jacarepaguá',
  '19º BPM - Copacabana',
  '20º BPM - Mesquita',
  '21º BPM - São João de Meriti',
  '22º BPM - Bonsucesso',
  '23º BPM - Leblon',
  '24º BPM - Queimados',
  '25º BPM - Cabo Frio',
  '26º BPM - Petrópolis',
  '27º BPM - Santa Cruz',
  '28º BPM - Volta Redonda',
  '29º BPM - Itaperuna',
  '30º BPM - Teresópolis',
  '31º BPM - Recreio',
  '32º BPM - Macaé',
  '33º BPM - Angra',
  '34º BPM - Magé',
  '35º BPM - Itaboraí',
  '36º BPM - Pádua',
  '37º BPM - Resende',
  '38º BPM - Três Rios',
  '39º BPM - Belford Roxo',
  '40º BPM - Campo Grande',
  '41º BPM - Irajá',
  '42º BPM - Araruama',
  '43º BPM - Pavuna',
  '44º BPM - Nova Iguaçu',
  '45º BPM - Jacarezinho',
  '46º BPM - Campos Guarus',
  '47º BPM - Barra da Tijuca',
] as const

export const RAS_LOCALS_SPECIAL: readonly string[] = [
  'BOPE',
  'BPChq',
  'RECOM',
  'BPVE',
  'BAC',
  'GAM',
  'BPRv',
  'GPFer',
  'CPAM',
  'BPtur',
  'BEPE',
] as const

export const RAS_LOCALS_UPP: readonly string[] = [
  '01 UPP 2ºBPM - SANTA MARTA',
  '01 UPP 22ºBPM - ADEUS BAIANA',
  '02 UPP 5ºBPM - PROVIDÊNCIA',
  '03 UPP 19ºBPM - PAVÃO',
  '03 UPP 19ºBPM - TABAJARAS',
  '04 UPP 19ºBPM - BABILÔNIA',
  '05 UPP 23ºBPM - ROCINHA',
  '06 UPP 3ºBPM - SÃO JOÃO',
  '07 UPP 3ºBPM - JACAREZINHO',
  '08 UPP 3ºBPM - LINS',
  '09 UPP 4ºBPM - TURANO',
  '10 UPP 6ºBPM - BOREL',
  '11 UPP 6ºBPM - MACACOS',
  '12 UPP 16ºBPM - COMPLEXO DO ALEMÃO',
  '13 UPP 16ºBPM - COMPLEXO DA PENHA',
  '15 UPP 22ºBPM - MANGUINHOS',
  '16 UPP 4ºBPM - MANGUEIRA',
] as const

export const RAS_ALL_LOCALS: readonly string[] = [
  ...RAS_LOCALS_BPM,
  ...RAS_LOCALS_SPECIAL,
  ...RAS_LOCALS_UPP,
] as const

// ─── Business rules ───────────────────────────────────────────────────────────

export const RAS_MAX_MONTHLY_HOURS = 120 as const
export const RAS_WARNING_THRESHOLD = 96 as const
export const RAS_MIN_REST_HOURS = 8 as const
export const RAS_REALIZE_WINDOW_HOURS = 72 as const

// ─── Core domain entities ─────────────────────────────────────────────────────

export interface RasAgenda {
  id: string
  userId: string
  data: string               // ISO date (yyyy-MM-dd)
  horaInicio: string         // HH:mm
  horaFim: string            // HH:mm
  duracao: DuracaoRas
  local: string
  graduacao: GraduacaoRas
  tipo: TipoRas
  tipoVaga: TipoVagaRas
  valorCentavos: number
  status: StatusRas
  competencia: string        // yyyy-MM
  observacoes?: string | null
  expiresAt?: string | null  // ISO datetime — 72h window for realizado→pendente
  createdAt: string
  updatedAt: string
  agendamentos?: RasAgendamento[]
  pagamentos?: RasPagamento[]
}

export interface RasAgendamento {
  id: string
  rasAgendaId: string
  userId: string
  status: StatusRas
  dataRealizacao?: string | null
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  rasAgenda?: RasAgenda
}

export interface RasPagamento {
  id: string
  rasAgendaId: string
  userId: string
  valorCentavos: number
  competencia: string
  dataPagamento?: string | null
  comprovante?: string | null
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  rasAgenda?: RasAgenda
}

export interface RasCenarioSalvo {
  id: string
  userId: string
  nome: string
  descricao?: string | null
  mes: string
  graduacao: GraduacaoRas
  eventos: RasCenarioEvento[]
  totalHoras: number
  totalCentavos: number
  createdAt: string
  updatedAt: string
}

export interface RasCenarioEvento {
  data: string
  local: string
  duracao: DuracaoRas
}

// ─── Request / Response payloads ─────────────────────────────────────────────

export interface CreateRasAgendaInput {
  data: string
  horaInicio: string
  horaFim: string
  duracao: DuracaoRas
  local: string
  graduacao: GraduacaoRas
  tipo: TipoRas
  tipoVaga: TipoVagaRas
  competencia: string
  observacoes?: string
}

export interface UpdateRasAgendaInput {
  data?: string
  horaInicio?: string
  horaFim?: string
  duracao?: DuracaoRas
  local?: string
  graduacao?: GraduacaoRas
  tipo?: TipoRas
  tipoVaga?: TipoVagaRas
  competencia?: string
  status?: StatusRas
  observacoes?: string | null
}

export interface RasAgendaFilters {
  competencia?: string
  status?: StatusRas | 'all'
  graduacao?: GraduacaoRas | 'all'
  local?: string
  page?: number
  pageSize?: number
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface RasHistoricoMes {
  competencia: string
  totalHoras: number
  totalCentavos: number
}

export interface RasMonthStats {
  competencia: string
  totalHoras: number
  totalCentavos: number
  totalEventos: number
  eventosPendentes: number
  eventosConfirmados: number
  percentualLimite: number
  alertaLimite: boolean
  horasRestantes: number
  horasPorStatus: Record<StatusRas, number>
  contagemPorStatus: Record<StatusRas, number>
  centavosPorStatus: Record<StatusRas, number>
  horasPorGraduacao: Record<string, number>
  historico3Meses: RasHistoricoMes[]
}

// ─── Display labels ───────────────────────────────────────────────────────────

export const RAS_STATUS_LABELS: Record<StatusRas, string> = {
  agendado:   '📅 Agendado',
  realizado:  '✅ Realizado',
  pendente:   '⏳ Pendente',
  confirmado: '🔒 Confirmado',
  cancelado:  '❌ Cancelado',
} as const

export const RAS_STATUS_COLORS: Record<StatusRas, { color: string; bg: string }> = {
  agendado:   { color: '#60a5fa', bg: 'rgba(96,165,250,.15)'  },
  realizado:  { color: '#22c55e', bg: 'rgba(34,197,94,.15)'   },
  pendente:   { color: '#f59e0b', bg: 'rgba(245,158,11,.15)'  },
  confirmado: { color: '#10b981', bg: 'rgba(16,185,129,.15)'  },
  cancelado:  { color: '#ef4444', bg: 'rgba(239,68,68,.15)'   },
} as const

export const RAS_DURACAO_LABELS: Record<DuracaoRas, string> = {
  6: '6 horas', 8: '8 horas', 12: '12 horas', 24: '24 horas',
} as const

export const RAS_GRADUACAO_LABELS: Record<GraduacaoRas, string> = {
  'SD/CB':      'Soldado / Cabo',
  'SGT/SUBTEN': 'Sargento / Subtenente',
} as const

export const RAS_TIPO_LABELS: Record<TipoRas, string> = {
  voluntario:  '✅ Voluntário',
  compulsorio: '⚡ Compulsório',
} as const

export const RAS_VAGA_LABELS: Record<TipoVagaRas, string> = {
  titular: '★ Titular',
  reserva: '🎭 Reserva',
} as const

// ─── Type arrays ──────────────────────────────────────────────────────────────

export const RAS_GRADUATION_TYPES: GraduacaoRas[] = ['SD/CB', 'SGT/SUBTEN'] as const
export const RAS_DURACAO_TYPES: DuracaoRas[] = [6, 8, 12, 24] as const
export const RAS_STATUS_TYPES: StatusRas[] = ['agendado', 'realizado', 'pendente', 'confirmado', 'cancelado'] as const
export const RAS_TIPO_TYPES: TipoRas[] = ['voluntario', 'compulsorio'] as const
export const RAS_VAGA_TYPES: TipoVagaRas[] = ['titular', 'reserva'] as const

export const RAS_DEFAULT_PAGE_SIZE = 20 as const

export const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/
export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/
export const COMPETENCIA_FORMAT_REGEX = /^\d{4}-\d{2}$/
