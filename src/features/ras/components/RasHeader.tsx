'use client'

import { Plus, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { fmtBRL } from '@/types/ras'
import type { RasMonthStats, StatusRas } from '@/types/ras'

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasHeaderProps {
  competencia: string
  onCompetenciaChange: (c: string) => void
  stats?: RasMonthStats | null
  onNovoClick: () => void
}

const RAS_MAX = 120

// Ordem de exibição dos status
const STATUS_CONFIG: Array<{
  key: StatusRas
  label: string
  activeColor: string
  activeBg: string
}> = [
  { key: 'agendado',  label: 'Agendado',   activeColor: 'text-blue-600 dark:text-blue-400',    activeBg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'realizado', label: 'Realizado',  activeColor: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { key: 'pendente',  label: 'Pendente',   activeColor: 'text-amber-600 dark:text-amber-400',   activeBg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'confirmado',label: 'Confirmado', activeColor: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-50 dark:bg-purple-500/10' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function RasHeader({ competencia, onCompetenciaChange, stats, onNovoClick }: RasHeaderProps) {
  const pct        = stats ? Math.min(Math.round((stats.totalHoras / RAS_MAX) * 100), 100) : 0
  const isAlert    = stats ? stats.totalHoras >= 96 : false
  const isWarning  = stats ? stats.totalHoras >= 72 : false
  const barColor   = isAlert ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
  const pctColor   = isAlert
    ? 'text-red-500 dark:text-red-400'
    : isWarning
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-gray-400 dark:text-gray-500'

  const garantido   = stats ? (stats.centavosPorStatus?.confirmado ?? 0) : 0
  const emAndamento = stats
    ? (stats.centavosPorStatus?.realizado ?? 0) + (stats.centavosPorStatus?.pendente ?? 0)
    : 0

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  const mobileCard = (
    <div className="sm:hidden rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm overflow-hidden">
      {/* Linha 1: nav mês + título + CTA */}
      <div className="flex items-center gap-1.5 px-2 pt-2.5 pb-2">
        <button
          onClick={() => onCompetenciaChange(addMonths(competencia, -1))}
          aria-label="Mês anterior"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <ChevronLeft size={14} aria-hidden />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate select-none">
            RAS
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 select-none">
            {formatCompetenciaLabel(competencia)}
          </p>
        </div>

        <button
          onClick={() => onCompetenciaChange(addMonths(competencia, 1))}
          aria-label="Próximo mês"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <ChevronRight size={14} aria-hidden />
        </button>

        <button
          onClick={onNovoClick}
          className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold transition-colors shrink-0"
        >
          <Plus size={12} aria-hidden />
          Novo
        </button>
      </div>

      {/* Linha 2: progresso compacto */}
      <div className="px-3 pb-2">
        {stats ? (
          <>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
                  {stats.totalHoras}h
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">/ 120h</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold tabular-nums ${pctColor}`}>{pct}%</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {fmtBRL(stats.totalCentavos)}
                </span>
              </div>
            </div>
            <div
              className="h-2 bg-gray-100 dark:bg-white/[0.07] rounded-full overflow-hidden"
              role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
              aria-label={`${stats.totalHoras} de 120 horas`}
            >
              <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <div className="h-10 animate-pulse bg-gray-100 dark:bg-white/[0.05] rounded-lg" />
        )}
      </div>

      {/* Linha 3: contadores por status */}
      {stats && (
        <div className="flex border-t border-gray-100 dark:border-white/[0.06]">
          {STATUS_CONFIG.map(({ key, label, activeColor }) => {
            const count = stats.contagemPorStatus?.[key] ?? 0
            return (
              <div
                key={key}
                className="flex-1 flex flex-col items-center py-2 border-r border-gray-100 dark:border-white/[0.06] last:border-r-0"
              >
                <span className={`text-sm font-bold tabular-nums leading-none ${count > 0 ? activeColor : 'text-gray-300 dark:text-gray-600'}`}>
                  {count}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── DESKTOP ─────────────────────────────────────────────────────────────────
  const desktopCard = (
    <div className="hidden sm:block space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">RAS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Regime Adicional de Serviço
          </p>
        </div>
        <button
          onClick={onNovoClick}
          className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} aria-hidden />
          Agendar RAS
        </button>
      </div>

      {/* Card dividido 50/50 */}
      <div className="grid grid-cols-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm overflow-hidden">

        {/* Esquerda: navegação de mês + progresso */}
        <div className="px-5 py-4 border-r border-gray-100 dark:border-white/[0.06]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => onCompetenciaChange(addMonths(competencia, -1))}
              aria-label="Mês anterior"
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 select-none">
              {formatCompetenciaLabel(competencia)}
            </span>
            <button
              onClick={() => onCompetenciaChange(addMonths(competencia, 1))}
              aria-label="Próximo mês"
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>

          {stats ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
                  {stats.totalHoras}h
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">/ 120h</span>
              </div>
              <div
                className="h-2.5 bg-gray-100 dark:bg-white/[0.07] rounded-full overflow-hidden"
                role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                aria-label={`${stats.totalHoras} de 120 horas`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-medium ${pctColor}`}>{pct}% do limite</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {RAS_MAX - stats.totalHoras > 0
                    ? `${RAS_MAX - stats.totalHoras}h restantes`
                    : 'Limite atingido'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-20 bg-gray-100 dark:bg-white/[0.05] rounded" />
              <div className="h-2.5 bg-gray-100 dark:bg-white/[0.05] rounded-full" />
              <div className="h-3 w-28 bg-gray-100 dark:bg-white/[0.05] rounded" />
            </div>
          )}
        </div>

        {/* Direita: grid de status + projeção financeira */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {stats ? (
            <>
              {/* 2x2 grid de status */}
              <div className="grid grid-cols-2 gap-2 flex-1">
                {STATUS_CONFIG.map(({ key, label, activeColor, activeBg }) => {
                  const count = stats.contagemPorStatus?.[key] ?? 0
                  return (
                    <div
                      key={key}
                      className={`rounded-lg px-3 py-2 transition-colors ${count > 0 ? activeBg : 'bg-gray-50 dark:bg-white/[0.03]'}`}
                    >
                      <span className={`text-xl font-bold tabular-nums leading-none block ${count > 0 ? activeColor : 'text-gray-300 dark:text-gray-600'}`}>
                        {count}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Projeção financeira */}
              <div className="border-t border-gray-100 dark:border-white/[0.06] pt-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-500 shrink-0" aria-hidden />
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">Total faturado</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmtBRL(stats.totalCentavos)}
                  </span>
                </div>
                {garantido > 0 && (
                  <div className="flex items-center justify-between gap-2 pl-4">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Garantido</span>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                      {fmtBRL(garantido)}
                    </span>
                  </div>
                )}
                {emAndamento > 0 && (
                  <div className="flex items-center justify-between gap-2 pl-4">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Em andamento</span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      {fmtBRL(emAndamento)}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2 animate-pulse">
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 dark:bg-white/[0.05] rounded-lg" />
                ))}
              </div>
              <div className="h-3 bg-gray-100 dark:bg-white/[0.05] rounded mt-2" />
              <div className="h-3 w-3/4 bg-gray-100 dark:bg-white/[0.05] rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {mobileCard}
      {desktopCard}
    </>
  )
}
