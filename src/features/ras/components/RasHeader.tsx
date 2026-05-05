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
    <div className="flex flex-col gap-1.5 w-full sm:min-w-[180px]">
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">Horas do mês</span>
        <span className={`text-sm font-semibold tabular-nums ${alerta ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
          {stats.totalHoras}h / 120h
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.07] overflow-hidden">
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
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            RAS
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
            Regime Adicional de Serviço ·{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{periodoLabel}</span>
          </p>
        </div>
        {/* 44px min touch target */}
        <button
          onClick={onNovoClick}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} aria-hidden />
          <span className="hidden xs:inline sm:inline">Agendar RAS</span>
          <span className="xs:hidden sm:hidden">Novo</span>
        </button>
      </div>

      {/* Summary strip — responsive grid on mobile, flex-wrap on desktop */}
      {stats && (
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm">
          {/* Top row: chips in 3-col grid on mobile */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:items-center gap-x-0 sm:gap-x-6 gap-y-0 sm:gap-y-3 px-4 sm:px-5 pt-4 pb-3 sm:py-4">
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
          </div>

          {/* Hours progress bar — full width on its own row */}
          <div className="px-4 sm:px-5 pb-4 pt-1 sm:pt-0 border-t border-gray-100 dark:border-white/[0.05] sm:border-t-0">
            <HorasBar stats={stats} />
          </div>
        </div>
      )}
    </div>
  )
}
