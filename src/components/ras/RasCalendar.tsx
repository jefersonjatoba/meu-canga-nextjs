'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { RasAgenda } from '@/types/ras'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowBR(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ─── Calendar Component ───────────────────────────────────────────────────────

interface RasCalendarProps {
  /** yyyy-MM */
  competencia: string
  rasList: RasAgenda[]
  /** Called with a yyyy-MM-dd string when a day is clicked */
  onDayClick?: (dateStr: string) => void
  className?: string
}

export function RasCalendar({
  competencia,
  rasList,
  onDayClick,
  className,
}: RasCalendarProps) {
  const [y, m] = competencia.split('-').map(Number)

  // Build offset: Monday-first week (European style)
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay() // 0=Sun
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const daysInMonth = new Date(y, m, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Group RAS by day-of-month
  const byDay = useMemo(() => {
    const map: Record<number, RasAgenda[]> = {}
    for (const r of rasList) {
      // Only show non-cancelled RAS
      if (r.status === 'cancelado') continue
      const d = parseInt(r.data.slice(8, 10), 10)
      if (!map[d]) map[d] = []
      map[d].push(r)
    }
    return map
  }, [rasList])

  const today = nowBR()

  return (
    <div
      className={cn(
        'rounded-xl p-4',
        className
      )}
      style={{ background: '#12122a', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Week headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] text-gray-500 font-medium py-1"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />

          const dayRas = byDay[day] ?? []
          const isToday =
            today.getFullYear() === y &&
            today.getMonth() + 1 === m &&
            today.getDate() === day
          const isClickable = !!onDayClick

          return (
            <div
              key={day}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => {
                if (!onDayClick) return
                const dd = String(day).padStart(2, '0')
                const mm = String(m).padStart(2, '0')
                onDayClick(`${y}-${mm}-${dd}`)
              }}
              onKeyDown={(e) => {
                if (!onDayClick) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  const dd = String(day).padStart(2, '0')
                  const mm = String(m).padStart(2, '0')
                  onDayClick(`${y}-${mm}-${dd}`)
                }
              }}
              className={cn(
                'relative rounded-lg p-1 flex flex-col items-center transition-colors',
                isClickable && 'cursor-pointer hover:bg-white/5'
              )}
              style={{
                minHeight: dayRas.length ? 52 : 36,
                background: isToday
                  ? 'rgba(37,99,235,0.2)'
                  : dayRas.length
                  ? 'rgba(255,255,255,0.03)'
                  : 'transparent',
                border: isToday
                  ? '1px solid rgba(37,99,235,0.5)'
                  : '1px solid transparent',
              }}
            >
              <span
                className={cn(
                  'text-[11px] font-medium leading-tight',
                  isToday ? 'text-blue-400' : 'text-gray-300'
                )}
              >
                {day}
              </span>

              {/* RAS dots */}
              <div className="flex flex-col gap-0.5 mt-0.5 w-full items-center">
                {dayRas.map((r, i) => {
                  const isVol = r.tipo === 'voluntario'
                  return (
                    <span
                      key={i}
                      className="text-[8px] font-bold px-0.5 rounded w-full text-center truncate leading-tight"
                      style={{
                        background: isVol
                          ? 'rgba(96,165,250,0.2)'
                          : 'rgba(245,158,11,0.2)',
                        color: isVol ? '#93c5fd' : '#fcd34d',
                      }}
                      title={`${isVol ? 'Voluntário' : 'Compulsório'} ${r.duracao}h — ${r.status}`}
                    >
                      {isVol ? 'V' : 'C'} {r.duracao}h
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap gap-4 mt-3 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#60a5fa' }}
          />
          <span className="text-[10px] text-gray-400">V = Voluntário</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#f59e0b' }}
          />
          <span className="text-[10px] text-gray-400">C = Compulsório</span>
        </div>
        {onDayClick && (
          <span className="text-[10px] text-gray-500 ml-auto">
            Clique em um dia para agendar
          </span>
        )}
      </div>
    </div>
  )
}

export default RasCalendar
