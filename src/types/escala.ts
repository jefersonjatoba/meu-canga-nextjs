// ─── Escala (Work Schedule) Domain Types ─────────────────────────────────────

export type TipoTurno = 'MATUTINO' | 'VESPERTINO' | 'NOTURNO'
export type StatusEscala = 'agendada' | 'realizada' | 'cancelada'

export interface Escala {
  id: string
  userId: string
  dataEscala: string // ISO date string (yyyy-MM-dd)
  tipoTurno: TipoTurno
  localServico?: string | null
  status: StatusEscala
  createdAt: string
  updatedAt: string
}

// ─── Request / Response payloads ─────────────────────────────────────────────

export interface CreateEscalaInput {
  dataEscala: string // yyyy-MM-dd
  tipoTurno: TipoTurno
  localServico?: string
}

export interface UpdateEscalaInput {
  dataEscala?: string
  tipoTurno?: TipoTurno
  localServico?: string | null
  status?: StatusEscala
}

// ─── Filter params ───────────────────────────────────────────────────────────

export interface EscalaFilters {
  mes?: string  // yyyy-MM
  status?: StatusEscala | 'all'
  tipoTurno?: TipoTurno | 'all'
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
}

// ─── Turno metadata ──────────────────────────────────────────────────────────

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

export const STATUS_CONFIG = {
  agendada: {
    label: 'Agendada',
    variant: 'primary' as const,
  },
  realizada: {
    label: 'Realizada',
    variant: 'success' as const,
  },
  cancelada: {
    label: 'Cancelada',
    variant: 'error' as const,
  },
} as const
