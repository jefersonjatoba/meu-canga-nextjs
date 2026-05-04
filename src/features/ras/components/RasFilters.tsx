'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addMonths(competencia: string, delta: number): string {
  const [year, month] = competencia.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

function formatCompetenciaLabel(competencia: string): string {
  const [year, month] = competencia.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, 1))
  const label = d
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

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
  { value: 'all',       label: 'Todas graduações' },
  { value: 'SD/CB',     label: 'SD / CB' },
  { value: 'SGT/SUBTEN',label: 'SGT / SUBTEN' },
] as const

const LOCAL_OPTIONS = [
  { value: '',          label: 'Todos os locais' },
  { value: 'BPM',      label: 'BPM' },
  { value: 'Especiais', label: 'Especiais' },
  { value: 'UPP',      label: 'UPP' },
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasFiltersProps {
  competencia: string
  onCompetenciaChange: (c: string) => void
  status?: string
  onStatusChange: (s: string) => void
  graduacao?: string
  onGraduacaoChange: (g: string) => void
  local?: string
  onLocalChange: (l: string) => void
}

// ─── Shared select style ──────────────────────────────────────────────────────

const selectClass = cn(
  'rounded-lg px-3 py-2 text-sm transition-colors',
  'bg-white dark:bg-[#1E1E1E]',
  'text-gray-700 dark:text-gray-200',
  'border border-gray-200 dark:border-gray-700/60',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
  'disabled:opacity-50'
)

// ─── Component ────────────────────────────────────────────────────────────────

export function RasFilters({
  competencia,
  onCompetenciaChange,
  status = 'all',
  onStatusChange,
  graduacao = 'all',
  onGraduacaoChange,
  local = '',
  onLocalChange,
}: RasFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
      {/* Month navigator */}
      <div className="flex items-center gap-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700/60 rounded-lg p-1">
        <button
          onClick={() => onCompetenciaChange(addMonths(competencia, -1))}
          aria-label="Mês anterior"
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[130px] text-center">
          {formatCompetenciaLabel(competencia)}
        </span>
        <button
          onClick={() => onCompetenciaChange(addMonths(competencia, 1))}
          aria-label="Próximo mês"
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1">
        <label className="sr-only">Filtrar por status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrar por status"
          className={selectClass}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Graduação */}
      <div className="flex flex-col gap-1">
        <label className="sr-only">Filtrar por graduação</label>
        <select
          value={graduacao}
          onChange={(e) => onGraduacaoChange(e.target.value)}
          aria-label="Filtrar por graduação"
          className={selectClass}
        >
          {GRADUACAO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Local */}
      <div className="flex flex-col gap-1">
        <label className="sr-only">Filtrar por local</label>
        <select
          value={local}
          onChange={(e) => onLocalChange(e.target.value)}
          aria-label="Filtrar por local"
          className={selectClass}
        >
          {LOCAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
