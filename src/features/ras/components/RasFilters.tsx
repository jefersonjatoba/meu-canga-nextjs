'use client'

import { cn } from '@/lib/utils'

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'all',        label: 'Todos' },
  { value: 'agendado',   label: 'Agendado' },
  { value: 'realizado',  label: 'Realizado' },
  { value: 'pendente',   label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'cancelado',  label: 'Cancelado' },
] as const

const GRADUACAO_OPTIONS = [
  { value: 'all',        label: 'Todas graduações' },
  { value: 'SD/CB',      label: 'SD / CB' },
  { value: 'SGT/SUBTEN', label: 'SGT / SUBTEN' },
] as const

const LOCAL_OPTIONS = [
  { value: '',           label: 'Todos os locais' },
  { value: 'BPM',        label: 'BPM' },
  { value: 'Especiais',  label: 'Especiais' },
  { value: 'UPP',        label: 'UPP' },
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasFiltersProps {
  status?: string
  onStatusChange: (s: string) => void
  graduacao?: string
  onGraduacaoChange: (g: string) => void
  local?: string
  onLocalChange: (l: string) => void
}

const selectClass = cn(
  'flex-1 rounded-lg px-3 min-h-[40px] text-sm transition-colors appearance-none',
  'bg-white dark:bg-[#1C1C1C]',
  'text-gray-700 dark:text-gray-200',
  'border border-gray-200 dark:border-white/[0.08]',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
)

// ─── Component ────────────────────────────────────────────────────────────────

export function RasFilters({
  status = 'all',
  onStatusChange,
  graduacao = 'all',
  onGraduacaoChange,
  local = '',
  onLocalChange,
}: RasFiltersProps) {
  return (
    <div className="space-y-2">
      {/* Status chips — horizontal scroll, sem barra visível */}
      <div
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-h-[32px]',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1C1C1C] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Graduação + Local selects */}
      <div className="flex gap-2">
        <select
          value={graduacao}
          onChange={(e) => onGraduacaoChange(e.target.value)}
          aria-label="Filtrar por graduação"
          className={selectClass}
        >
          {GRADUACAO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={local}
          onChange={(e) => onLocalChange(e.target.value)}
          aria-label="Filtrar por local"
          className={selectClass}
        >
          {LOCAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
