import { fmtBRL } from '@/types/ras'
import { RasCharts } from './RasCharts'
import type { RasMonthStats, StatusRas } from '@/types/ras'

// ─── Color + label maps ───────────────────────────────────────────────────────

const STATUS_COLORS: Record<StatusRas, string> = {
  agendado:  '#3b82f6',
  realizado: '#10b981',
  pendente:  '#f59e0b',
  confirmado:'#8b5cf6',
  cancelado: '#ef4444',
}

const STATUS_LABELS: Record<StatusRas, string> = {
  agendado:  'Agendado',
  realizado: 'Realizado',
  pendente:  'Pendente',
  confirmado:'Confirmado',
  cancelado: 'Cancelado',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasSidebarProps {
  stats: RasMonthStats | null
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="hidden lg:flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] p-5 space-y-3 animate-pulse">
        <div className="h-3 w-28 bg-gray-100 dark:bg-white/[0.05] rounded" />
        <div className="h-8 w-36 bg-gray-100 dark:bg-white/[0.05] rounded" />
        <div className="h-3 w-20 bg-gray-100 dark:bg-white/[0.05] rounded" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] p-5 space-y-3 animate-pulse">
        <div className="h-3 w-16 bg-gray-100 dark:bg-white/[0.05] rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 dark:bg-white/[0.05] rounded" />
        ))}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasSidebar({ stats }: RasSidebarProps) {
  if (!stats) return <Skeleton />

  const statuses: StatusRas[] = ['realizado', 'agendado', 'pendente', 'confirmado']
  const breakdown = statuses
    .map((s) => ({
      status: s,
      count:   stats.contagemPorStatus?.[s] ?? 0,
      horas:   stats.horasPorStatus?.[s]    ?? 0,
      centavos:stats.centavosPorStatus?.[s]  ?? 0,
    }))
    .filter((e) => e.count > 0)

  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-6 self-start">
      {/* ── Total faturado ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
          Total Faturado
        </p>
        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none mb-1">
          {fmtBRL(stats.totalCentavos)}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {stats.totalHoras}h registradas no mês
        </p>
      </div>

      {/* ── Breakdown por status ───────────────────────────────────────── */}
      {breakdown.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Por Status
          </p>
          <div className="space-y-3">
            {breakdown.map((e) => {
              const pct = stats.totalHoras > 0
                ? Math.round((e.horas / stats.totalHoras) * 100)
                : 0

              return (
                <div key={e.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STATUS_COLORS[e.status] }}
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {STATUS_LABELS[e.status]}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                        {e.count}×
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                      {e.horas}h
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-white/[0.07] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: STATUS_COLORS[e.status] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Faturamento por status ─────────────────────────────────────── */}
      {breakdown.some((e) => e.centavos > 0) && (
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Faturamento
          </p>
          <div className="space-y-2">
            {breakdown
              .filter((e) => e.centavos > 0)
              .map((e) => (
                <div key={e.status} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: STATUS_COLORS[e.status] }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {STATUS_LABELS[e.status]}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {fmtBRL(e.centavos)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Charts (colapsável) ────────────────────────────────────────── */}
      <RasCharts stats={stats} />
    </aside>
  )
}
