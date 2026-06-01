'use client'

import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { formatBRL } from '@/lib/money'
import { cn } from '@/lib/utils'

interface FinancialHeroCardProps {
  saldoOperacionalCentavos: number
  periodoLabel: string
  saldoAnteriorCentavos?: number
  historicoSaldos?: Array<{ mes: string; valor: number }>
  metaMensalCentavos?: number
}

const styles = {
  positive: {
    bg: 'bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),linear-gradient(135deg,rgba(240,253,244,1)_0%,rgba(236,253,245,0.92)_45%,rgba(255,255,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.20),_transparent_34%),linear-gradient(135deg,rgba(16,24,20,1)_0%,rgba(15,23,20,1)_55%,rgba(12,12,12,1)_100%)]',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    label: 'text-emerald-700 dark:text-emerald-300',
    value: 'text-emerald-700 dark:text-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300',
    message: 'Seu caixa está respirando bem neste mês.',
    progressBar: 'bg-emerald-500 dark:bg-emerald-400',
    Icon: TrendingUp,
  },
  negative: {
    bg: 'bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_34%),linear-gradient(135deg,rgba(254,242,242,1)_0%,rgba(255,245,245,0.92)_45%,rgba(255,255,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.18),_transparent_34%),linear-gradient(135deg,rgba(30,16,16,1)_0%,rgba(24,15,15,1)_55%,rgba(12,12,12,1)_100%)]',
    border: 'border-red-200 dark:border-red-500/20',
    label: 'text-red-700 dark:text-red-300',
    value: 'text-red-700 dark:text-red-200',
    badge: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300',
    message: 'O mês pede correções rápidas para proteger o saldo.',
    progressBar: 'bg-red-500 dark:bg-red-400',
    Icon: TrendingDown,
  },
  neutral: {
    bg: 'bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_32%),linear-gradient(135deg,rgba(249,250,251,1)_0%,rgba(255,255,255,1)_55%,rgba(255,255,255,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_32%),linear-gradient(135deg,rgba(24,24,27,1)_0%,rgba(18,18,18,1)_55%,rgba(12,12,12,1)_100%)]',
    border: 'border-gray-200 dark:border-white/[0.08]',
    label: 'text-gray-600 dark:text-gray-300',
    value: 'text-gray-900 dark:text-gray-100',
    badge: 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
    message: 'Ainda faltam movimentações para contar a história deste mês.',
    progressBar: 'bg-gray-400 dark:bg-gray-500',
    Icon: Minus,
  },
} as const

export function FinancialHeroCard({
  saldoOperacionalCentavos,
  periodoLabel,
  saldoAnteriorCentavos,
  historicoSaldos,
  metaMensalCentavos,
}: FinancialHeroCardProps) {
  const key =
    saldoOperacionalCentavos > 0
      ? 'positive'
      : saldoOperacionalCentavos < 0
        ? 'negative'
        : 'neutral'

  const s = styles[key]
  const { Icon } = s

  const hasPrevious = typeof saldoAnteriorCentavos === 'number' && saldoAnteriorCentavos !== 0
  const delta = hasPrevious
    ? ((saldoOperacionalCentavos - saldoAnteriorCentavos) / Math.abs(saldoAnteriorCentavos)) * 100
    : null

  const metaProgress =
    metaMensalCentavos && metaMensalCentavos > 0
      ? Math.min(Math.max((saldoOperacionalCentavos / metaMensalCentavos) * 100, 0), 100)
      : null

  const sparklineData = historicoSaldos
    ? historicoSaldos.slice(-6).map((item) => ({
        mes: item.mes.split('-')[1],
        valor: item.valor,
      }))
    : null

  return (
    <div className={cn('overflow-hidden rounded-[28px] border shadow-sm', s.bg, s.border)}>
      <div className="flex flex-col gap-8 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
        <div className="flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', s.badge)}>
              <Sparkles size={12} />
              Centro financeiro
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm dark:bg-black/20 dark:text-gray-300">
              {periodoLabel}
            </span>
          </div>

          <div className="space-y-2">
            <p className={cn('text-[11px] font-semibold uppercase tracking-[0.18em]', s.label)}>
              Saldo operacional
            </p>
            <p className={cn('text-3xl font-black tracking-tight tabular-nums sm:text-4xl lg:text-5xl', s.value)}>
              {formatBRL(saldoOperacionalCentavos)}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {delta !== null ? (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', s.badge)}>
                  {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toFixed(1)}% vs mês anterior
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm dark:bg-black/20 dark:text-gray-300">
                  Ainda sem comparativo consistente
                </span>
              )}

              <div className={cn('inline-flex items-center gap-1.5 text-sm font-medium', s.label)}>
                <Icon size={14} aria-hidden />
                {s.message}
              </div>
            </div>
          </div>

          {metaProgress !== null && (
            <div className="max-w-xl space-y-2">
              <div className="flex items-center justify-between">
                <p className={cn('text-xs font-semibold uppercase tracking-[0.16em]', s.label)}>
                  Meta do mês
                </p>
                <p className={cn('text-xs font-bold', s.value)}>{metaProgress.toFixed(0)}%</p>
              </div>
              <div className="h-2 rounded-full bg-gray-200/80 dark:bg-white/[0.08]">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', s.progressBar)}
                  style={{ width: `${metaProgress}%` }}
                  aria-hidden
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-[360px] space-y-3 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Tendência do saldo
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Últimos 6 meses
              </p>
            </div>
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', s.badge)}>
              {saldoOperacionalCentavos >= 0 ? 'Positivo' : 'Ajustar rumo'}
            </span>
          </div>

          {sparklineData && sparklineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={sparklineData} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={
                    key === 'positive'
                      ? '#10b981'
                      : key === 'negative'
                        ? '#ef4444'
                        : '#94a3b8'
                  }
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
              Assim que houver histórico suficiente, este bloco mostra a direção do seu caixa ao longo do tempo.
            </div>
          )}

          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            O saldo operacional cruza receitas, despesas, RAS e movimentações confirmadas para dar uma leitura rápida do momento.
          </p>
        </div>
      </div>
    </div>
  )
}
