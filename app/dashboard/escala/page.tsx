'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Bell,
  BellOff,
  BarChart3,
  LayoutGrid,
  List,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type TipoTurno,
  type EscalaEntry,
  type EscalaConfig,
  TIPO_TURNO_META,
  calcularProgresso,
  diasAteProximo,
  horasNoMes,
  formatarData,
  formatarDataCurta,
  formatarMesAno,
  todaySP,
} from '@/lib/escala'
import { deleteEscala, fetchConfig, fetchEscalas, fetchProximos } from '@/features/escala/api'
import { ConfigModal, ShiftModal } from '@/features/escala/components/EscalaModals'

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Auto-compute horaFim based on escala type and horaInicio */
// ─── Helper: get background color class by shift type ────────────────────────

function getShiftBg(tipo: TipoTurno): string {
  const map: Record<TipoTurno, string> = {
    plantao:    'bg-blue-500',
    sobreaviso: 'bg-amber-500',
    extra:      'bg-purple-500',
    ferias:     'bg-green-500',
    folga:      'bg-gray-400',
  }
  return map[tipo] ?? 'bg-gray-400'
}

function getShiftBgLight(tipo: TipoTurno): string {
  const map: Record<TipoTurno, string> = {
    plantao:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    sobreaviso: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    extra:      'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    ferias:     'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    folga:      'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700',
  }
  return map[tipo] ?? 'bg-gray-50'
}

function getBadgeVariant(tipo: TipoTurno): 'primary' | 'warning' | 'default' | 'success' {
  const map: Record<TipoTurno, 'primary' | 'warning' | 'default' | 'success'> = {
    plantao: 'primary',
    sobreaviso: 'warning',
    extra: 'default',
    ferias: 'success',
    folga: 'default',
  }
  return map[tipo] ?? 'default'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EscalaViewMode = 'agenda' | 'calendario'

// ─── API Functions ─────────────────────────────────────────────────────────────

// ─── LocalPickerField — tab + grid picker (replaces dropdown) ────────────────

function CountdownWidget({ proxima }: { proxima: EscalaEntry | undefined }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!proxima) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400 dark:text-gray-500">
        <CalendarDays size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Nenhum plantão agendado</p>
      </div>
    )
  }

  const progresso = calcularProgresso(proxima.data, proxima.horaInicio, proxima.horaFim)
  const meta = TIPO_TURNO_META[proxima.tipo as TipoTurno]

  let countdownText = ''
  if (progresso.status === 'futuro') {
    const [ano, mes, dia] = proxima.data.split('-').map(Number)
    const [h, m] = proxima.horaInicio.split(':').map(Number)
    const shiftStart = new Date(ano, mes - 1, dia, h, m)
    const diffMs = shiftStart.getTime() - now.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffH > 48) {
      countdownText = `em ${Math.ceil(diffH / 24)} dias`
    } else if (diffH > 0) {
      countdownText = `${diffH}h ${diffM}m`
    } else {
      countdownText = `${diffM}m`
    }
  } else if (progresso.status === 'em_progresso') {
    countdownText = `${progresso.pct}% concluído`
  } else {
    countdownText = 'Concluído'
  }

  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference - (progresso.pct / 100) * circumference
  const ringColor =
    progresso.status === 'em_progresso'
      ? '#3b82f6'
      : progresso.status === 'concluido'
      ? '#22c55e'
      : '#e5e7eb'

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={ringColor} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={strokeDash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">{meta?.emoji ?? '🚔'}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
          {progresso.status === 'em_progresso' ? 'Em andamento' : 'Próximo plantão'}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
          {countdownText}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{formatarData(proxima.data)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {proxima.horaInicio} – {proxima.horaFim}
          {proxima.local && ` · ${proxima.local}`}
        </p>
      </div>
    </div>
  )
}

function getRelativeShiftLabel(date: string): string {
  const [ano, mes, dia] = date.split('-').map(Number)
  const current = new Date(ano, mes - 1, dia)
  const [todayAno, todayMes, todayDia] = todaySP().split('-').map(Number)
  const today = new Date(todayAno, todayMes - 1, todayDia)
  const diff = Math.round((current.getTime() - today.getTime()) / 86_400_000)

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff > 1 && diff <= 6) return `Em ${diff} dias`
  return formatarDataCurta(date)
}

function getShiftDurationHours(escala: EscalaEntry): number {
  const [startHour, startMinute] = escala.horaInicio.split(':').map(Number)
  const [endHour, endMinute] = escala.horaFim.split(':').map(Number)

  let totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  if (totalMinutes <= 0) totalMinutes += 24 * 60

  return Math.round(totalMinutes / 60)
}

function getDaysUntilShift(date: string): number {
  const [ano, mes, dia] = date.split('-').map(Number)
  const current = new Date(ano, mes - 1, dia)
  const [todayAno, todayMes, todayDia] = todaySP().split('-').map(Number)
  const today = new Date(todayAno, todayMes - 1, todayDia)
  return Math.round((current.getTime() - today.getTime()) / 86_400_000)
}

function getAgendaDayTone(date: string): string {
  const diff = getDaysUntilShift(date)

  if (diff === 0) return 'border-blue-200/90 bg-[linear-gradient(135deg,rgba(239,246,255,0.96)_0%,rgba(255,255,255,0.96)_72%)] shadow-sm dark:border-blue-500/30 dark:bg-[linear-gradient(135deg,rgba(29,78,216,0.18)_0%,rgba(15,23,42,0.82)_72%)]'
  if (diff === 1) return 'border-indigo-200/90 bg-[linear-gradient(135deg,rgba(238,242,255,0.96)_0%,rgba(255,255,255,0.96)_72%)] shadow-sm dark:border-indigo-500/30 dark:bg-[linear-gradient(135deg,rgba(79,70,229,0.18)_0%,rgba(15,23,42,0.82)_72%)]'
  if (diff > 1 && diff <= 6) return 'border-emerald-200/90 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.96)_72%)] shadow-sm dark:border-emerald-500/20 dark:bg-[linear-gradient(135deg,rgba(5,150,105,0.16)_0%,rgba(15,23,42,0.82)_72%)]'
  return 'border-gray-200/90 bg-[linear-gradient(135deg,rgba(249,250,251,0.96)_0%,rgba(255,255,255,0.96)_72%)] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(15,23,42,0.82)_72%)]'
}

function getAgendaDayEyebrow(date: string): string {
  const diff = getDaysUntilShift(date)

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff > 1 && diff <= 6) return `Em ${diff} dias`
  if (diff < 0) return 'Concluído'
  return 'Planejado'
}

type AgendaGroup = {
  date: string
  shifts: EscalaEntry[]
}

function groupEscalasByDate(escalas: EscalaEntry[]): AgendaGroup[] {
  const ordered = [...escalas].sort((a, b) => {
    if (a.data === b.data) return a.horaInicio.localeCompare(b.horaInicio)
    return a.data.localeCompare(b.data)
  })

  const groups: AgendaGroup[] = []

  for (const escala of ordered) {
    const lastGroup = groups[groups.length - 1]
    if (!lastGroup || lastGroup.date !== escala.data) {
      groups.push({ date: escala.data, shifts: [escala] })
      continue
    }

    lastGroup.shifts.push(escala)
  }

  return groups
}

function UpcomingShiftsCard({
  escalas,
  onAdd,
  onEdit,
}: {
  escalas: EscalaEntry[]
  onAdd: () => void
  onEdit: (escala: EscalaEntry) => void
}) {
  const upcoming = escalas.slice(0, 4)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Próximos turnos</CardTitle>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sua agenda operacional imediata, sem precisar abrir o mês inteiro.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onAdd}
          >
            Novo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.9)_0%,rgba(255,255,255,0.96)_100%)] px-4 py-6 text-center dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(15,23,42,0.78)_100%)]">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum turno agendado agora</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Adicione o próximo serviço para ativar o radar da escala.
            </p>
          </div>
        ) : (
          upcoming.map((escala) => {
            const meta = TIPO_TURNO_META[escala.tipo as TipoTurno]
            const progresso = calcularProgresso(escala.data, escala.horaInicio, escala.horaFim)

            return (
              <button
                key={escala.id}
                type="button"
                onClick={() => onEdit(escala)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-3 text-left transition-all duration-150 hover:border-blue-300 hover:bg-blue-50/70 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getBadgeVariant(escala.tipo as TipoTurno)} size="sm">
                        {meta?.label ?? escala.tipo}
                      </Badge>
                      {progresso.status === 'em_progresso' && (
                        <Badge variant="primary" size="sm">Em andamento</Badge>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatarData(escala.data)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{escala.horaInicio} – {escala.horaFim}</span>
                      {escala.local && <span>• {escala.local}</span>}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm dark:bg-black/20 dark:text-gray-200">
                      {getRelativeShiftLabel(escala.data)}
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function StatCards({
  config,
  escalas,
}: {
  config: EscalaConfig | null
  escalas: EscalaEntry[]
}) {
  const horas = horasNoMes(escalas)
  const plantoes = escalas.filter((e) => e.tipo === 'plantao').length

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
      <Card className="col-span-2 p-4 xl:col-span-1 xl:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Escala ativa</p>
            {config ? (
              <>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 xl:text-2xl">{config.tipo}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{config.horaInicio} – {config.horaFim}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Ainda não configurada</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card className="p-4 xl:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Plantões no mês</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 xl:text-2xl">
              {plantoes}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {plantoes === 1 ? '1 plantão registrado' : `${plantoes} plantões registrados`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <BarChart3 size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </Card>

      <Card className="p-4 xl:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Horas no mês</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 xl:text-2xl">{horas}h</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Carga registrada até agora</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Modal: Add/Edit Shift ────────────────────────────────────────────────────

function CalendarGrid({
  ano,
  mes,
  escalas,
  today,
  onDayClick,
}: {
  ano: number
  mes: number
  escalas: EscalaEntry[]
  today: string
  onDayClick: (dateStr: string) => void
}) {
  const daysInMonth = new Date(ano, mes, 0).getDate()
  const firstDayOfWeek = new Date(ano, mes - 1, 1).getDay()

  const escalasByDay = React.useMemo(() => {
    const map: Record<number, EscalaEntry[]> = {}
    for (const e of escalas) {
      const dia = parseInt(e.data.split('-')[2])
      if (!map[dia]) map[dia] = []
      map[dia].push(e)
    }
    return map
  }, [escalas])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Weekday header — v1 style: blue tint background */}
      <div className="grid grid-cols-7 bg-blue-50/60 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
        {DIAS_SEMANA_HEADER.map((d) => (
          <div key={d} className="text-center py-2.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid — v1 style: bordered cells, no gap */}
      <div className="grid grid-cols-7">
        {cells.map((dia, idx) => {
          if (dia === null) {
            return <div key={`empty-${idx}`} className="min-h-[52px] border-r border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 sm:min-h-[68px] last:border-r-0" />
          }

          const dateStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
          const isToday = dateStr === today
          const dayEscalas = escalasByDay[dia] ?? []
          const firstEscala = dayEscalas[0]
          const hasShift = dayEscalas.length > 0
          const isPlantaoOrExtra = firstEscala && (firstEscala.tipo === 'plantao' || firstEscala.tipo === 'extra')
          const isOtherType = firstEscala && !isPlantaoOrExtra

          // Cell background — v1 style
          let cellBg = 'bg-white dark:bg-[#1E1E1E] hover:bg-blue-50/60 dark:hover:bg-blue-900/15'
          let textColor = 'text-gray-700 dark:text-gray-300'
          let borderColor = 'border-gray-200 dark:border-gray-700'

          if (isToday) {
            cellBg = 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
            textColor = 'text-white'
            borderColor = 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-700/50 z-10 relative'
          } else if (isPlantaoOrExtra) {
            cellBg = 'bg-blue-100/60 dark:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/40'
            textColor = 'text-blue-700 dark:text-blue-300'
            borderColor = 'border-blue-300 dark:border-blue-700'
          } else if (isOtherType) {
            cellBg = 'bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100/80 dark:hover:bg-teal-900/30'
            textColor = 'text-teal-700 dark:text-teal-400'
            borderColor = 'border-teal-300 dark:border-teal-700'
          }

          return (
            <button
              key={dia}
              onClick={() => onDayClick(dateStr)}
              aria-label={`${dia} de ${mes}`}
              className={cn(
                'relative min-h-[52px] border-r border-b flex flex-col items-center justify-center gap-1 px-1 py-1.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-[68px]',
                cellBg,
                borderColor,
                'last:border-r-0'
              )}
            >
              <span className={cn('text-[13px] font-semibold leading-none sm:text-sm', textColor, isToday && 'font-extrabold')}>
                {dia}
              </span>

              {/* Progress bar — v1 style */}
              {hasShift && firstEscala && (() => {
                const progresso = calcularProgresso(firstEscala.data, firstEscala.horaInicio, firstEscala.horaFim)
                // v1 colors:
                //  futuro -> amarelo (#FBBF24) full width
                //  em_progresso -> laranja (#F59E0B) at pct%
                //  concluido -> verde (#10B981) full width
                const barColor =
                  progresso.status === 'futuro'
                    ? 'bg-yellow-400'
                    : progresso.status === 'em_progresso'
                    ? 'bg-orange-500'
                    : 'bg-emerald-500'
                const barWidth = progresso.status === 'futuro' ? 100 : progresso.status === 'concluido' ? 100 : progresso.pct
                return (
                  <>
                    <div className="hidden h-3 w-full overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-700 sm:block">
                      <div
                        className={cn('h-full rounded-sm transition-all', barColor)}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1 sm:hidden">
                      <span className={cn('h-1.5 w-4 rounded-full', barColor)} />
                      {dayEscalas.length > 1 && (
                        <span className={cn('text-[8px] font-semibold leading-none', isToday ? 'text-white/90' : 'text-gray-500 dark:text-gray-400')}>
                          +{dayEscalas.length - 1}
                        </span>
                      )}
                    </div>
                  </>
                )
              })()}

              {dayEscalas.length > 1 && (
                <span className={cn('hidden text-[9px] font-medium leading-none sm:block', isToday ? 'text-white/80' : 'text-gray-400 dark:text-gray-500')}>
                  +{dayEscalas.length - 1}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Shift List Item ───────────────────────────────────────────────────────────

function ShiftListItem({
  escala,
  onEdit,
  onDelete,
  showDate = true,
}: {
  escala: EscalaEntry
  onEdit: (e: EscalaEntry) => void
  onDelete: (id: string) => void
  showDate?: boolean
}) {
  const meta = TIPO_TURNO_META[escala.tipo as TipoTurno]
  const progresso = calcularProgresso(escala.data, escala.horaInicio, escala.horaFim)
  const durationHours = getShiftDurationHours(escala)

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-3.5 transition-all duration-150 sm:flex-row sm:items-center ${getShiftBgLight(
        escala.tipo as TipoTurno
      )}`}
    >
      <div className="flex items-start gap-3">
        {/* Emoji badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/60 text-lg dark:bg-gray-800/60">
          {meta?.emoji ?? '🚔'}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {showDate ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatarData(escala.data)}
              </p>
            ) : null}
            <Badge variant={getBadgeVariant(escala.tipo as TipoTurno)} size="sm">
              {meta?.label ?? escala.tipo}
            </Badge>
            {progresso.status === 'em_progresso' && (
              <Badge variant="primary" size="sm">Em andamento</Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 flex-wrap">
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock size={11} />
              {escala.horaInicio} – {escala.horaFim}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {durationHours}h
            </p>
            {escala.local && (
              <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin size={11} />
                {escala.local}
              </p>
            )}
            {escala.alarmeAtivo ? (
              <Bell size={11} className="text-blue-400" />
            ) : (
              <BellOff size={11} className="text-gray-300 dark:text-gray-600" />
            )}
          </div>
          {escala.observacao && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">{escala.observacao}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-black/5 pt-2 dark:border-white/[0.06] sm:justify-start sm:border-t-0 sm:pt-0">
        <button
          onClick={() => onEdit(escala)}
          aria-label="Editar turno"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-150"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(escala.id)}
          aria-label="Excluir turno"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-150"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function MonthAgendaPanel({
  escalas,
  loading,
  deletingId,
  viewAno,
  viewMes,
  onAdd,
  onEdit,
  onDelete,
}: {
  escalas: EscalaEntry[]
  loading: boolean
  deletingId: string | null
  viewAno: number
  viewMes: number
  onAdd: () => void
  onEdit: (e: EscalaEntry) => void
  onDelete: (id: string) => void
}) {
  const groupedEscalas = React.useMemo(() => groupEscalasByDate(escalas), [escalas])
  const scheduledDays = groupedEscalas.length
  const nextSevenDays = escalas.filter((escala) => {
    const diff = getDaysUntilShift(escala.data)
    return diff >= 0 && diff <= 6
  }).length
  const inProgress = escalas.filter((escala) => {
    const progresso = calcularProgresso(escala.data, escala.horaInicio, escala.horaFim)
    return progresso.status === 'em_progresso'
  }).length

  return (
    <Card className="overflow-hidden border-gray-200/80 dark:border-white/[0.08]">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <List size={12} />
              Agenda do mês
            </div>
            <CardTitle className="mt-3 text-xl">Turnos de {formatarMesAno(viewAno, viewMes)}</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Use esta visão para escanear o mês por dia, editar rápido e entender onde sua rotina está mais carregada.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="rounded-full bg-white/80 px-2.5 py-1 shadow-sm dark:bg-black/20">Ritmo da semana</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1 shadow-sm dark:bg-black/20">Alarme de plantão</span>
            </div>
          </div>

          <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={onAdd}>
            Adicionar turno
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,0.98)_100%)] p-3 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(15,23,42,0.75)_100%)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Dias escalados</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{scheduledDays}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {scheduledDays === 1 ? '1 dia com serviço no mês' : `${scheduledDays} dias com serviço no mês`}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,0.98)_100%)] p-3 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(15,23,42,0.75)_100%)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Próximos 7 dias</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{nextSevenDays}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Janela imediata para revisar folgas, extras e plantões
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,0.98)_100%)] p-3 dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(15,23,42,0.75)_100%)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Em andamento</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{inProgress}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Turnos que já estão rodando agora
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : escalas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-gray-200 bg-[linear-gradient(135deg,rgba(248,250,252,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-12 text-center dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(15,23,42,0.75)_100%)]">
            <CalendarDays size={40} className="opacity-40 text-gray-400 dark:text-gray-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum turno registrado neste mês</p>
            <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
              Cadastre o próximo serviço para transformar esta faixa em uma agenda viva, com leitura rápida por dia.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="rounded-full bg-white/85 px-2.5 py-1 shadow-sm dark:bg-black/20">Próximo turno</span>
              <span className="rounded-full bg-white/85 px-2.5 py-1 shadow-sm dark:bg-black/20">Calendário tático</span>
              <span className="rounded-full bg-white/85 px-2.5 py-1 shadow-sm dark:bg-black/20">Ajuste rápido</span>
            </div>
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={onAdd}>
              Criar primeiro turno
            </Button>
          </div>
        ) : (
          groupedEscalas.map((group) => (
            <section
              key={group.date}
              className={cn(
                'rounded-3xl border p-3.5 sm:p-4',
                getAgendaDayTone(group.date),
              )}
            >
              <div className="flex flex-col gap-3 border-b border-black/5 pb-3 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm dark:bg-black/25 dark:text-gray-200">
                      {getAgendaDayEyebrow(group.date)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {group.shifts.length === 1 ? '1 turno' : `${group.shifts.length} turnos`}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                    {formatarData(group.date)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Janela do dia organizada para ajuste rápido e leitura imediata.
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Carga do dia
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {group.shifts.reduce((sum, shift) => sum + getShiftDurationHours(shift), 0)}h
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                {group.shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={cn(
                      'transition-opacity duration-300',
                      deletingId === shift.id && 'pointer-events-none opacity-40',
                    )}
                  >
                    <ShiftListItem
                      escala={shift}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      showDate={false}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function EscalaPage() {
  const today = todaySP()
  const [currentDate] = useState(() => {
    const [y, m] = today.split('-').map(Number)
    return { ano: y, mes: m }
  })
  const [viewAno, setViewAno] = useState(currentDate.ano)
  const [viewMes, setViewMes] = useState(currentDate.mes)

  const [escalas, setEscalas] = useState<EscalaEntry[]>([])
  const [escalasProximas, setEscalasProximas] = useState<EscalaEntry[]>([])
  const [config, setConfig] = useState<EscalaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [mobileView, setMobileView] = useState<EscalaViewMode>('agenda')
  const [editShift, setEditShift] = useState<EscalaEntry | null>(null)
  const [prefillDate, setPrefillDate] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      // Use allSettled so a failure in one (e.g. proximos) doesn't block the others
      const [escResult, cfgResult, proxResult] = await Promise.allSettled([
        fetchEscalas(viewAno, viewMes),
        fetchConfig(),
        fetchProximos(),
      ])

      if (escResult.status === 'fulfilled') setEscalas(escResult.value)
      else setLoadError(escResult.reason?.message ?? 'Erro ao buscar escalas')

      if (cfgResult.status === 'fulfilled') setConfig(cfgResult.value)

      if (proxResult.status === 'fulfilled') setEscalasProximas(proxResult.value)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [viewAno, viewMes])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const prevMonth = () => {
    if (viewMes === 1) { setViewMes(12); setViewAno((y) => y - 1) }
    else setViewMes((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMes === 12) { setViewMes(1); setViewAno((y) => y + 1) }
    else setViewMes((m) => m + 1)
  }

  const handleDayClick = (dateStr: string) => {
    setPrefillDate(dateStr)
    setEditShift(null)
    setShiftModalOpen(true)
  }

  const handleEditShift = (escala: EscalaEntry) => {
    setEditShift(escala)
    setPrefillDate('')
    setShiftModalOpen(true)
  }

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este turno?')) return
    setDeletingId(id)
    try {
      await deleteEscala(id)
      // Otimista: remove imediatamente do estado
      setEscalas((prev) => prev.filter((e) => e.id !== id))
      setEscalasProximas((prev) => prev.filter((e) => e.id !== id))
      // Sincroniza em segundo plano
      loadData()
    } catch {
      // Em caso de erro, recarrega para sincronizar
      loadData()
    } finally {
      setDeletingId(null)
    }
  }

  // Atualiza estado otimisticamente quando ShiftModal salva uma escala
  const handleShiftSaved = useCallback(async (saved?: EscalaEntry) => {
    if (saved) {
      // Pertence ao mês visualizado?
      const [savedAno, savedMes] = saved.data.split('-').map(Number)
      const isCurrentMonth = savedAno === viewAno && savedMes === viewMes

      setEscalas((prev) => {
        const filtered = prev.filter((e) => e.id !== saved.id) // remove se já existia (edit)
        if (isCurrentMonth) {
          return [...filtered, saved].sort((a, b) => a.data.localeCompare(b.data))
        }
        return filtered
      })

      setEscalasProximas((prev) => {
        const filtered = prev.filter((e) => e.id !== saved.id)
        return [...filtered, saved]
          .sort((a, b) => a.data.localeCompare(b.data))
          .slice(0, 10)
      })
    }
    // Sincroniza com backend em segundo plano
    loadData()
  }, [viewAno, viewMes, loadData])

  const proximaEscala = React.useMemo(() => {
    const r = diasAteProximo(escalasProximas)
    return r.proxima
  }, [escalasProximas])

  return (
    <div className="space-y-6 lg:space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Escala de Trabalho
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Abra a rotina do serviço com prioridade no próximo turno, na agenda imediata e no calendário do mês.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setEditShift(null)
              setPrefillDate(today)
              setShiftModalOpen(true)
            }}
          >
            Novo turno
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Settings size={14} />}
            onClick={() => setConfigModalOpen(true)}
          >
            Configurar escala
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-blue-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(135deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_56%,rgba(255,255,255,1)_100%)] shadow-sm dark:border-blue-500/20 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.92)_0%,rgba(17,24,39,0.96)_56%,rgba(12,12,12,1)_100%)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm dark:bg-black/20 dark:text-blue-300">
                <Sparkles size={12} />
                Centro operacional
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-[2rem]">
                  Sua escala precisa responder rápido, não pesar.
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  Veja o próximo serviço primeiro, ajuste a semana com agilidade e use o calendário como visão tática do mês.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:min-w-[320px]">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Escala ativa
                </p>
                <p className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">
                  {config?.tipo ?? 'Sem padrão'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Próximo foco
                </p>
                <p className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">
                  {proximaEscala ? getRelativeShiftLabel(proximaEscala.data) : 'Sem turno'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Próximo turno
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seu ponto principal de leitura e decisão
                  </p>
                </div>
              </div>
            </div>
            <CountdownWidget proxima={proximaEscala} />
          </div>
        </CardContent>
      </Card>

      <StatCards config={config} escalas={escalas} />

      <div className="lg:hidden">
        <div className="inline-flex w-full items-center rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
          <button
            type="button"
            onClick={() => setMobileView('agenda')}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors',
              mobileView === 'agenda'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400',
            )}
          >
            <List size={15} />
            Agenda
          </button>
          <button
            type="button"
            onClick={() => setMobileView('calendario')}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors',
              mobileView === 'calendario'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400',
            )}
          >
            <LayoutGrid size={15} />
            Calendário
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Calendar — v1 fintech style: dark gradient header */}
        <Card className={cn('overflow-hidden p-0', mobileView !== 'calendario' && 'hidden lg:block')}>
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight capitalize">
                {formatarMesAno(viewAno, viewMes)}
              </h3>
              <p className="mt-1 text-xs text-white/70">
                Use esta visão quando precisar distribuir e revisar o mês completo.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="w-9 h-9 rounded-xl grid place-items-center text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => { setViewAno(currentDate.ano); setViewMes(currentDate.mes) }}
                className="px-3 h-9 rounded-xl text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Hoje
              </button>
              <button
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="w-9 h-9 rounded-xl grid place-items-center text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertTriangle size={32} className="text-red-400" />
                <p className="text-sm text-gray-500">{loadError}</p>
                <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <CalendarGrid
                  ano={viewAno}
                  mes={viewMes}
                  escalas={escalas}
                  today={today}
                  onDayClick={handleDayClick}
                />

                {/* Legenda compacta — embaixo do calendário */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" /> Futuro
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Em andamento
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Concluído
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipo</span>
                    {Object.entries(TIPO_TURNO_META).map(([tipo, meta]) => (
                      <span key={tipo} className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                        <span className={`w-2.5 h-2.5 rounded-sm ${getShiftBg(tipo as TipoTurno)}`} />
                        {meta.emoji} {meta.label}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className={cn('space-y-6', mobileView !== 'agenda' && 'hidden lg:block')}>
          <UpcomingShiftsCard
            escalas={escalasProximas}
            onAdd={() => {
              setEditShift(null)
              setPrefillDate(today)
              setShiftModalOpen(true)
            }}
            onEdit={handleEditShift}
          />
        </div>
      </div>

      {/* Shift List */}
      <MonthAgendaPanel
        escalas={escalas}
        loading={loading}
        deletingId={deletingId}
        viewAno={viewAno}
        viewMes={viewMes}
        onAdd={() => {
          setEditShift(null)
          setPrefillDate(today)
          setShiftModalOpen(true)
        }}
        onEdit={handleEditShift}
        onDelete={handleDeleteShift}
      />

      {false && <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Turnos de {formatarMesAno(viewAno, viewMes)}</CardTitle>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {escalas.length} registro{escalas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : escalas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400 dark:text-gray-500">
              <CalendarDays size={40} className="opacity-40" />
              <p className="text-sm">Nenhum turno registrado neste mês</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Clique em um dia no calendário para adicionar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {escalas.map((e) => (
                <div
                  key={e.id}
                  className={`transition-opacity duration-300 ${deletingId === e.id ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <ShiftListItem
                    escala={e}
                    onEdit={handleEditShift}
                    onDelete={handleDeleteShift}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>}

      {/* Add/Edit Modal */}
      <ShiftModal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        initialData={
          editShift
            ? {
                data: editShift.data,
                horaInicio: editShift.horaInicio,
                horaFim: editShift.horaFim,
                tipo: editShift.tipo as TipoTurno,
                local: editShift.local ?? '',
                observacao: editShift.observacao ?? '',
                alarmeAtivo: editShift.alarmeAtivo,
              }
            : prefillDate
            ? {
                data: prefillDate,
                horaInicio: config?.horaInicio ?? '07:00',
                horaFim: config?.horaFim ?? '19:00',
                local: config?.local ?? '',
                alarmeAtivo: config?.alarmeAtivo ?? true,
              }
            : undefined
        }
        editId={editShift?.id}
        onSaved={handleShiftSaved}
      />

      {/* Config Modal */}
      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        currentConfig={config}
        currentAno={viewAno}
        currentMes={viewMes}
        onSaved={loadData}
      />
    </div>
  )
}
