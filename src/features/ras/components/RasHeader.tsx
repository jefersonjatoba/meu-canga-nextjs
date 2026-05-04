import { Plus } from 'lucide-react'
import { fmtBRL } from '@/types/ras'
import type { RasMonthStats } from '@/types/ras'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCompetenciaLabel(competencia: string): string {
  const [year, month] = competencia.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, 1))
  const label = d
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ─── SummaryChip — mesmo padrão de Lançamentos ───────────────────────────────

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'positive' | 'negative' | 'neutral' | 'warning'
}) {
  const colorMap = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-500 dark:text-red-400',
    neutral:  'text-gray-700 dark:text-gray-200',
    warning:  'text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${colorMap[tone]}`}>{value}</span>
    </div>
  )
}

// ─── HorasBar — barra de progresso do limite mensal ──────────────────────────

function HorasBar({ stats }: { stats: RasMonthStats }) {
  const pct = Math.min(stats.percentualLimite, 100)
  const alerta = stats.alertaLimite

  return (
    <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[180px]">
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">Horas do mês</span>
        <span className={`text-sm font-semibold tabular-nums ${alerta ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
          {stats.totalHoras}h / 120h
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            alerta
              ? 'bg-red-500'
              : pct >= 80
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasHeaderProps {
  competencia: string
  stats?: RasMonthStats | null
  onNovoClick: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasHeader({ competencia, stats, onNovoClick }: RasHeaderProps) {
  const periodoLabel = formatCompetenciaLabel(competencia)

  return (
    <div className="flex flex-col gap-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            RAS
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Regime Adicional de Serviço ·{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{periodoLabel}</span>
          </p>
        </div>
        <button
          onClick={onNovoClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} aria-hidden />
          Agendar RAS
        </button>
      </div>

      {/* Summary strip */}
      {stats && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm">
          <SummaryChip
            label="Total de Horas"
            value={`${stats.totalHoras}h`}
            tone="neutral"
          />
          <SummaryChip
            label="Total R$"
            value={fmtBRL(stats.totalCentavos)}
            tone="positive"
          />
          <SummaryChip
            label="Agendados"
            value={String(stats.contagemPorStatus?.agendado ?? 0)}
            tone="neutral"
          />
          <SummaryChip
            label="Realizados"
            value={String(stats.contagemPorStatus?.realizado ?? 0)}
            tone="positive"
          />
          <SummaryChip
            label="A Confirmar"
            value={String((stats.contagemPorStatus?.pendente ?? 0) + (stats.contagemPorStatus?.realizado ?? 0))}
            tone={((stats.contagemPorStatus?.pendente ?? 0) + (stats.contagemPorStatus?.realizado ?? 0)) > 0 ? 'warning' : 'neutral'}
          />
          <SummaryChip
            label="Confirmados"
            value={String(stats.contagemPorStatus?.confirmado ?? 0)}
            tone="positive"
          />

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-gray-700/60" aria-hidden />

          {/* Hours bar */}
          <HorasBar stats={stats} />
        </div>
      )}
    </div>
  )
}
