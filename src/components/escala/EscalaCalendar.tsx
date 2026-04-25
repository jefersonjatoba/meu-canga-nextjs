'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Sun, Sunset, Moon } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Escala, TipoTurno } from '@/types/escala'
import { TURNO_CONFIG, STATUS_CONFIG } from '@/types/escala'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EscalaCalendarProps {
  escalas: Escala[]
  isLoading?: boolean
  /** Currently displayed month — format: yyyy-MM */
  mes: string
  onMesChange: (mes: string) => void
  onDayClick?: (date: string, escalas: Escala[]) => void
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TURNO_ICONS: Record<TipoTurno, React.ReactNode> = {
  MATUTINO: <Sun size={10} aria-hidden />,
  VESPERTINO: <Sunset size={10} aria-hidden />,
  NOTURNO: <Moon size={10} aria-hidden />,
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) cells.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d))
  }

  return cells
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addMonths(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EscalaCalendar({
  escalas,
  isLoading = false,
  mes,
  onMesChange,
  onDayClick,
  className,
}: EscalaCalendarProps) {
  const [year, month] = mes.split('-').map(Number) // month: 1-indexed
  const cells = getMonthDays(year, month - 1) // getMonthDays expects 0-indexed month
  const today = todayISO()

  // Build a map: dateString -> Escala[]
  const escalasByDate = React.useMemo(() => {
    const map = new Map<string, Escala[]>()
    for (const e of escalas) {
      const key = new Date(e.dataEscala).toISOString().slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [escalas])

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className={cn('flex flex-col gap-3', className)}
      role="grid"
      aria-label={`Calendário de escalas — ${monthLabel}`}
    >
      {/* Header: month navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onMesChange(addMonths(mes, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onMesChange(addMonths(mes, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px" role="row">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            role="columnheader"
            aria-label={wd}
            className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1" role="rowgroup">
          {cells.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} role="gridcell" aria-hidden />
            }

            const dateStr = isoDate(date)
            const dayEscalas = escalasByDate.get(dateStr) ?? []
            const isToday = dateStr === today
            const hasEscalas = dayEscalas.length > 0
            const isPast = dateStr < today

            return (
              <button
                key={dateStr}
                role="gridcell"
                aria-label={`${date.getDate()} — ${
                  hasEscalas
                    ? dayEscalas
                        .map((e) => `${TURNO_CONFIG[e.tipoTurno as TipoTurno].label} (${STATUS_CONFIG[e.status].label})`)
                        .join(', ')
                    : 'sem escala'
                }`}
                aria-selected={hasEscalas}
                onClick={() => onDayClick?.(dateStr, dayEscalas)}
                className={cn(
                  'relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[52px]',
                  'text-xs font-medium transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
                  // Base
                  'border border-transparent',
                  !hasEscalas &&
                    !isToday &&
                    'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                  // Today highlight
                  isToday &&
                    !hasEscalas &&
                    'border-accent-blue text-accent-blue font-semibold bg-blue-50 dark:bg-blue-900/20',
                  // Past days
                  isPast && !hasEscalas && 'opacity-50',
                  // Has escalas
                  hasEscalas && 'cursor-pointer hover:scale-[1.04] hover:shadow-sm'
                )}
              >
                <span>{date.getDate()}</span>

                {/* Escala dots */}
                {hasEscalas && (
                  <div className="flex flex-wrap gap-0.5 justify-center mt-1 px-0.5">
                    {dayEscalas.slice(0, 2).map((e) => {
                      const cfg = TURNO_CONFIG[e.tipoTurno as TipoTurno]
                      return (
                        <span
                          key={e.id}
                          className={cn(
                            'inline-flex items-center justify-center w-4 h-4 rounded-sm text-[9px]',
                            cfg.bgClass,
                            cfg.textClass,
                            e.status === 'cancelada' && 'opacity-50 line-through'
                          )}
                          aria-hidden
                        >
                          {TURNO_ICONS[e.tipoTurno as TipoTurno]}
                        </span>
                      )
                    })}
                    {dayEscalas.length > 2 && (
                      <span className="text-[9px] text-gray-400">+{dayEscalas.length - 2}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div
        className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800"
        aria-label="Legenda de turnos"
      >
        {(['MATUTINO', 'VESPERTINO', 'NOTURNO'] as TipoTurno[]).map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span
              className={cn(
                'inline-flex items-center justify-center w-4 h-4 rounded-sm',
                TURNO_CONFIG[t].bgClass,
                TURNO_CONFIG[t].textClass
              )}
              aria-hidden
            >
              {TURNO_ICONS[t]}
            </span>
            {TURNO_CONFIG[t].label}
          </span>
        ))}
      </div>
    </div>
  )
}
