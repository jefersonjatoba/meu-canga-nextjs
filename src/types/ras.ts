// ─── RAS (Regime Adicional de Serviço) Domain Types ──────────────────────────

// ─── Graduation types ─────────────────────────────────────────────────────────

export type GraduacaoRas = 'SD/CB' | 'SGT/SUBTEN'

// ─── Duration options (hours) ─────────────────────────────────────────────────

export type DuracaoRas = 6 | 8 | 12 | 24

// ─── Price table (values in cents to avoid floating-point rounding) ───────────
// Source: ras.config.js from MeuCanga_v1
// SD/CB:      6h → R$ 208,63 | 8h → R$ 272,47 | 12h → R$ 400,15 | 24h → R$ 783,21
// SGT/SUBTEN: 6h → R$ 243,92 | 8h → R$ 319,52 | 12h → R$ 470,74 | 24h → R$ 924,37

export const RAS_PRICE_TABLE: Record<GraduacaoRas, Record<DuracaoRas, number>> =
  {
    'SD/CB': {
      6: 20863,
      8: 27247,
      12: 40015,
      24: 78321,
    },
    'SGT/SUBTEN': {
      6: 24392,
      8: 31952,
      12: 47074,
      24: 92437,
    },
  } as const

/** Returns the price in cents for a given graduation + duration combination. */
export function getRasPrice(
  graduacao: GraduacaoRas,
  duracao: DuracaoRas
): number {
  return RAS_PRICE_TABLE[graduacao][duracao]
}

/** Returns the price formatted as a BRL currency string (e.g. "R$ 400,15"). */
export function getRasPriceBRL(
  graduacao: GraduacaoRas,
  duracao: DuracaoRas
): string {
  const cents = getRasPrice(graduacao, duracao)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

// ─── Status transitions ───────────────────────────────────────────────────────
// agendado → realizado → pendente → confirmado
// Any status → cancelado

export type StatusRas =
  | 'agendado'
  | 'realizado'
  | 'pendente'
  | 'confirmado'
  | 'cancelado'

// ─── Location arrays ──────────────────────────────────────────────────────────
// Source: ras.config.js from MeuCanga_v1

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
  'ROTAM',
  'BPCHOQUE',
  'BPTUR',
  'BPAMB',
  'BPFRON',
  'CIPM',
  'CIPE',
  'GETAM',
  'GOE',
] as const

export const RAS_LOCALS_UPP: readonly string[] = [
  'UPP Alemão',
  'UPP Andaraí',
  'UPP Arará',
  'UPP Batan',
  'UPP Borel',
  'UPP Caraté',
  'UPP Cavalão',
  'UPP Chapéu Mangueira',
  'UPP Cidade de Deus',
  'UPP Coroa',
  'UPP Fallet',
  'UPP Fazendinha',
  'UPP Formiga',
  'UPP Jacarezinho',
  'UPP Kelson',
  'UPP Lins',
  'UPP Macacos',
  'UPP Mangueira',
  'UPP Manguinhos',
  'UPP Morro dos Macacos',
  'UPP Nova Brasília',
  'UPP Prazeres',
  'UPP Rocinha',
  'UPP Salgueiro',
  'UPP São Carlos',
  'UPP Serra',
  'UPP Turano',
  'UPP União',
  'UPP Vila Cruzeiro',
  'UPP Vila Kennedy',
  'UPP Viradouro',
  'UPP Zumbi',
] as const

/** All valid RAS locations (union of the three arrays above). */
export const RAS_ALL_LOCALS: readonly string[] = [
  ...RAS_LOCALS_BPM,
  ...RAS_LOCALS_SPECIAL,
  ...RAS_LOCALS_UPP,
] as const

// ─── Business rules / thresholds ─────────────────────────────────────────────

/** Maximum RAS hours allowed per calendar month. */
export const RAS_MAX_MONTHLY_HOURS = 120 as const

/** Hours threshold at which a warning is shown (80% of max). */
export const RAS_WARNING_THRESHOLD = 96 as const

/** Mandatory rest period (hours) between consecutive RAS events. */
export const RAS_MIN_REST_HOURS = 8 as const

/** Window (hours) within which a RAS must be marked as realized after the event. */
export const RAS_REALIZE_WINDOW_HOURS = 72 as const

// ─── Core domain entities ─────────────────────────────────────────────────────

/**
 * RasAgenda – the main planning record for a scheduled RAS event.
 * Corresponds to the future RasAgenda Prisma model.
 */
export interface RasAgenda {
  id: string
  userId: string
  data: string               // ISO date (yyyy-MM-dd)
  horaInicio: string         // HH:mm
  horaFim: string            // HH:mm
  duracao: DuracaoRas        // derived from horaInicio / horaFim or explicit
  local: string
  graduacao: GraduacaoRas
  valorCentavos: number      // from RAS_PRICE_TABLE at time of creation
  status: StatusRas
  observacoes?: string | null
  competencia: string        // yyyy-MM – month this RAS counts toward
  createdAt: string
  updatedAt: string
  // Relations (populated when joined)
  agendamentos?: RasAgendamento[]
  pagamentos?: RasPagamento[]
}

/**
 * RasAgendamento – a booking/slot within an RasAgenda.
 * Allows multiple bookings per planned event (e.g. reserve + confirm).
 */
export interface RasAgendamento {
  id: string
  rasAgendaId: string
  userId: string
  status: StatusRas
  dataRealizacao?: string | null   // ISO datetime when the event was carried out
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  // Relations
  rasAgenda?: RasAgenda
}

/**
 * RasPagamento – payment tracking for a realized RAS.
 */
export interface RasPagamento {
  id: string
  rasAgendaId: string
  userId: string
  valorCentavos: number
  competencia: string        // yyyy-MM
  dataPagamento?: string | null
  comprovante?: string | null  // URL or file reference
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  // Relations
  rasAgenda?: RasAgenda
}

/**
 * RasCenarioSalvo – a saved projection/scenario for RAS earnings.
 */
export interface RasCenarioSalvo {
  id: string
  userId: string
  nome: string
  descricao?: string | null
  mes: string                // yyyy-MM the scenario is modeled for
  graduacao: GraduacaoRas
  eventos: RasCenarioEvento[]   // serialized JSON array
  totalHoras: number
  totalCentavos: number
  createdAt: string
  updatedAt: string
}

export interface RasCenarioEvento {
  data: string               // yyyy-MM-dd
  local: string
  duracao: DuracaoRas
}

// ─── Request / Response payloads ─────────────────────────────────────────────

export interface CreateRasAgendaInput {
  data: string               // yyyy-MM-dd
  horaInicio: string         // HH:mm
  horaFim: string            // HH:mm
  duracao: DuracaoRas
  local: string
  graduacao: GraduacaoRas
  competencia: string        // yyyy-MM
  observacoes?: string
}

export interface UpdateRasAgendaInput {
  data?: string
  horaInicio?: string
  horaFim?: string
  duracao?: DuracaoRas
  local?: string
  graduacao?: GraduacaoRas
  competencia?: string
  status?: StatusRas
  observacoes?: string | null
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface RasAgendaFilters {
  competencia?: string       // yyyy-MM
  status?: StatusRas | 'all'
  graduacao?: GraduacaoRas | 'all'
  local?: string
  page?: number
  pageSize?: number
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface RasMonthStats {
  competencia: string        // yyyy-MM
  totalHoras: number
  totalCentavos: number
  totalEventos: number
  eventosPendentes: number
  eventosConfirmados: number
  percentualLimite: number   // 0–100 (relative to RAS_MAX_MONTHLY_HOURS)
  alertaLimite: boolean      // true when totalHoras >= RAS_WARNING_THRESHOLD
}

// ─── Display labels ───────────────────────────────────────────────────────────

export const RAS_STATUS_LABELS: Record<StatusRas, string> = {
  agendado: '📅 Agendado',
  realizado: '✅ Realizado',
  pendente: '⏳ Pendente',
  confirmado: '🔒 Confirmado',
  cancelado: '❌ Cancelado',
} as const

export const RAS_DURACAO_LABELS: Record<DuracaoRas, string> = {
  6: '6 horas',
  8: '8 horas',
  12: '12 horas',
  24: '24 horas',
} as const

export const RAS_GRADUACAO_LABELS: Record<GraduacaoRas, string> = {
  'SD/CB': 'Soldado / Cabo',
  'SGT/SUBTEN': 'Sargento / Subtenente',
} as const

// ─── Constants and type arrays ───────────────────────────────────────────

export const RAS_GRADUATION_TYPES: GraduacaoRas[] = [
  'SD/CB',
  'SGT/SUBTEN',
] as const

export const RAS_DURACAO_TYPES: DuracaoRas[] = [6, 8, 12, 24] as const

export const RAS_STATUS_TYPES: StatusRas[] = [
  'agendado',
  'realizado',
  'pendente',
  'confirmado',
  'cancelado',
] as const

// ─── Pagination constants ────────────────────────────────────────────────

export const RAS_DEFAULT_PAGE_SIZE = 20 as const

// ─── Time format patterns ────────────────────────────────────────────────

export const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/
export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/
export const COMPETENCIA_FORMAT_REGEX = /^\d{4}-\d{2}$/

// ─── Color configuration for status display ─────────────────────────────

export const RAS_STATUS_COLORS: Record<StatusRas, string> = {
  agendado: 'blue',
  realizado: 'green',
  pendente: 'yellow',
  confirmado: 'purple',
  cancelado: 'red',
} as const
