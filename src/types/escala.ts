// ─── Escala (Work Schedule) Domain Types ─────────────────────────────────────

// ─── Shift types (tipoPlantao) ────────────────────────────────────────────────

export type TipoPlantao =
  | 'plantao'
  | 'sobreaviso'
  | 'extra'
  | 'folga'
  | 'ferias'

// Legacy turn type kept for backward compatibility with existing DB rows
export type TipoTurno = 'MATUTINO' | 'VESPERTINO' | 'NOTURNO'

export type StatusEscala = 'agendada' | 'realizada' | 'cancelada'

// ─── Cycle types ──────────────────────────────────────────────────────────────

export type TipoCiclo =
  | '12x24-12x72'
  | '12x24-12x48'
  | '24x48'
  | '24x72'
  | '12x36-folgao'

// ─── Cycle configuration ──────────────────────────────────────────────────────
// horasTrabalhadas: hours worked per shift
// diasCiclo: total days in one full cycle
// diasTrabalho: work days per cycle
// descricao: human-readable description

export const CYCLE_CONFIG: Record<
  TipoCiclo,
  {
    horasTrabalhadas: number
    diasCiclo: number
    diasTrabalho: number
    descricao: string
  }
> = {
  '12x24-12x72': {
    horasTrabalhadas: 12,
    diasCiclo: 5,
    diasTrabalho: 2,
    descricao: '12h trabalho / 24h folga / 12h trabalho / 72h folga',
  },
  '12x24-12x48': {
    horasTrabalhadas: 12,
    diasCiclo: 4,
    diasTrabalho: 2,
    descricao: '12h trabalho / 24h folga / 12h trabalho / 48h folga',
  },
  '24x48': {
    horasTrabalhadas: 24,
    diasCiclo: 3,
    diasTrabalho: 1,
    descricao: '24h trabalho / 48h folga',
  },
  '24x72': {
    horasTrabalhadas: 24,
    diasCiclo: 4,
    diasTrabalho: 1,
    descricao: '24h trabalho / 72h folga',
  },
  '12x36-folgao': {
    horasTrabalhadas: 12,
    diasCiclo: 14,
    diasTrabalho: 6,
    descricao: '12h trabalho / 36h folga com folgão quinzenal alternado',
  },
} as const

// ─── Shift constants ──────────────────────────────────────────────────────
export const SHIFT_TYPES: TipoPlantao[] = [
  'plantao',
  'sobreaviso',
  'extra',
  'folga',
  'ferias',
] as const

export const CYCLE_TYPES: TipoCiclo[] = [
  '12x24-12x72',
  '12x24-12x48',
  '24x48',
  '24x72',
  '12x36-folgao',
] as const

export const STATUS_TYPES: StatusEscala[] = [
  'agendada',
  'realizada',
  'cancelada',
] as const

// ─── Cycle day-calculation helpers ───────────────────────────────────────────
// Returns true when the given offset (days from cycle reference date) is a work day.

export function isWorkDay(ciclo: TipoCiclo, df: number): boolean {
  const mod = (n: number, m: number) => ((n % m) + m) % m

  switch (ciclo) {
    case '12x24-12x72': {
      const r = mod(df, 5)
      return r === 0 || r === 1
    }
    case '12x24-12x48': {
      const r = mod(df, 4)
      return r === 0 || r === 1
    }
    case '24x48': {
      return mod(df, 3) === 0
    }
    case '24x72': {
      return mod(df, 4) === 0
    }
    case '12x36-folgao': {
      // Biweekly alternating pattern.
      // Week A (even fortnight): Mon/Wed/Fri  →  weekday 1, 3, 5
      // Week B (odd fortnight):  Tue/Thu/Sat  →  weekday 2, 4, 6
      // df is assumed to start on a Monday of week A.
      const weekIndex = Math.floor(df / 7)
      const dayOfWeek = mod(df, 7) // 0 = Mon … 6 = Sun
      if (weekIndex % 2 === 0) {
        return dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4
      } else {
        return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5
      }
    }
    default:
      return false
  }
}

// ─── Default times ────────────────────────────────────────────────────────────

export const DEFAULT_HORA_INICIO = '07:00' as const
export const DEFAULT_HORA_FIM = '19:00' as const

// ─── Common constants ─────────────────────────────────────────────────────────

/** Default pagination page size for escalas list */
export const ESCALA_DEFAULT_PAGE_SIZE = 20 as const

/** Maximum hours that can be worked per day in escalas */
export const ESCALA_MAX_HOURS_PER_DAY = 24 as const

/** Time format regex pattern (HH:mm) */
export const TIME_FORMAT_REGEX = /^\d{2}:\d{2}$/

/** Date format regex pattern (yyyy-MM-dd) */
export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/

// ─── Display labels ───────────────────────────────────────────────────────────

export const ESCALA_TYPE_LABELS: Record<TipoPlantao, string> = {
  plantao: '🏥 Plantão',
  sobreaviso: '📟 Sobreaviso',
  extra: '⚡ Extra',
  folga: '🌴 Folga',
  ferias: '🏖️ Férias',
} as const

export const CYCLE_LABELS: Record<TipoCiclo, string> = {
  '12x24-12x72': '12x24 / 12x72',
  '12x24-12x48': '12x24 / 12x48',
  '24x48': '24x48',
  '24x72': '24x72',
  '12x36-folgao': '12x36 (folgão)',
} as const

// ─── Core domain entity ───────────────────────────────────────────────────────

export interface Escala {
  id: string
  userId: string
  dataEscala: string     // ISO date string (yyyy-MM-dd)
  tipoPlantao: TipoPlantao
  tipoCiclo?: TipoCiclo | null
  horaInicio: string     // HH:mm
  horaFim: string        // HH:mm
  localServico?: string | null
  observacoes?: string | null
  status: StatusEscala
  createdAt: string
  updatedAt: string
}

// ─── Request / Response payloads ─────────────────────────────────────────────

export interface CreateEscalaInput {
  dataEscala: string     // yyyy-MM-dd
  tipoPlantao: TipoPlantao
  tipoCiclo?: TipoCiclo
  horaInicio?: string    // defaults to DEFAULT_HORA_INICIO
  horaFim?: string       // defaults to DEFAULT_HORA_FIM
  localServico?: string
  observacoes?: string
}

export interface UpdateEscalaInput {
  dataEscala?: string
  tipoPlantao?: TipoPlantao
  tipoCiclo?: TipoCiclo | null
  horaInicio?: string
  horaFim?: string
  localServico?: string | null
  observacoes?: string | null
  status?: StatusEscala
}

// ─── Filter params ───────────────────────────────────────────────────────────

export interface EscalaFilters {
  mes?: string           // yyyy-MM
  status?: StatusEscala | 'all'
  tipoPlantao?: TipoPlantao | 'all'
  tipoCiclo?: TipoCiclo | 'all'
  localServico?: string
  page?: number
  pageSize?: number
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface EscalaStats {
  totalAgendadas: number
  totalRealizadas: number
  totalCanceladas: number
  proximaEscala: Escala | null
  horasMes: number
}

// ─── Turno metadata (legacy display config) ──────────────────────────────────

export const TURNO_CONFIG = {
  MATUTINO: {
    label: 'Matutino',
    horario: '06:00 – 14:00',
    color: 'amber' as const,
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-300 dark:border-amber-700',
  },
  VESPERTINO: {
    label: 'Vespertino',
    horario: '14:00 – 22:00',
    color: 'orange' as const,
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-300 dark:border-orange-700',
  },
  NOTURNO: {
    label: 'Noturno',
    horario: '22:00 – 06:00',
    color: 'indigo' as const,
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    borderClass: 'border-indigo-300 dark:border-indigo-700',
  },
} as const

export const STATUS_CONFIG: Record<
  StatusEscala,
  { label: string; variant: 'primary' | 'success' | 'error' }
> = {
  agendada: { label: 'Agendada', variant: 'primary' },
  realizada: { label: 'Realizada', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'error' },
} as const
