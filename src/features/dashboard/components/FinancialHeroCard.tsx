'use client'

import { formatBRL } from '@/lib/money'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface FinancialHeroCardProps {
  saldoOperacionalCentavos: number
  periodoLabel: string
  saldoAnteriorCentavos?: number
  historicoSaldos?: Array<{ mes: string; valor: number }>
  metaMensalCentavos?: number
}

const styles = {
  positive: {
    bg: 'bg-gradient-to-br from-green-50 via-emerald-50/60 to-white dark:from-emerald-500/[0.08] dark:via-emerald-500/[0.04] dark:to-[#1C1C1C]',
    border: 'border-green-200 dark:border-emerald-500/20',
    label: 'text-green-700 dark:text-emerald-400',
    value: 'text-green-600 dark:text-emerald-300',
    badge: 'bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-400',
    message: 'Você está no positivo este mês.',
    progressBar: 'bg-green-500 dark:bg-emerald-500',
    Icon: TrendingUp,
  },
  negative: {
    bg: 'bg-gradient-to-br from-red-50 via-rose-50/60 to-white dark:from-red-500/[0.08] dark:via-red-500/[0.04] dark:to-[#1C1C1C]',
    border: 'border-red-200 dark:border-red-500/20',
    label: 'text-red-700 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
    message: 'Atenção: saldo operacional negativo.',
    progressBar: 'bg-red-500 dark:bg-red-500',
    Icon: TrendingDown,
  },
  neutral: {
    bg: 'bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.03] dark:to-[#1C1C1C]',
    border: 'border-gray-200 dark:border-white/[0.08]',
    label: 'text-gray-500 dark:text-gray-400',
    value: 'text-gray-800 dark:text-gray-100',
    badge: 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
    message: 'Nenhum lançamento confirmado ainda.',
    progressBar: 'bg-gray-400 dark:bg-gray-500',
    Icon: Minus,
  },
}

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

  // Calcular delta %
  const delta =
    saldoAnteriorCentavos && saldoAnteriorCentavos !== 0
      ? ((saldoOperacionalCentavos - saldoAnteriorCentavos) / Math.abs(saldoAnteriorCentavos)) * 100
      : null

  // Calcular progresso de meta
  const metaProgress =
    metaMensalCentavos && metaMensalCentavos > 0
      ? Math.min(Math.max((saldoOperacionalCentavos / metaMensalCentavos) * 100, 0), 100)
      : null

  // Preparar dados para sparkline (máximo 6 meses)
  const sparklineData = historicoSaldos
    ? historicoSaldos.slice(-6).map((item) => ({
        mes: item.mes.split('-')[1], // Pega só o mês
        valor: item.valor,
      }))
    : null

  return (
    <div className={cn('rounded-2xl border shadow-sm p-4 sm:p-6 lg:p-8', s.bg, s.border)}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Coluna esquerda: Saldo e contexto */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1.5">
            <p className={cn('text-[10px] sm:text-xs font-semibold uppercase tracking-widest', s.label)}>
              Saldo Operacional
            </p>
            <p className={cn('text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight tabular-nums', s.value)}>
              {formatBRL(saldoOperacionalCentavos)}
            </p>

            {/* Delta vs mês anterior */}
            {delta !== null && (
              <p className={cn('text-sm font-medium flex items-center gap-1.5', s.label)}>
                {delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} {Math.abs(delta).toFixed(1)}% vs mês anterior
              </p>
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <Icon size={13} className={s.label} aria-hidden />
              <p className={cn('text-xs sm:text-sm', s.label)}>{s.message}</p>
            </div>
          </div>

          {/* Progress bar de meta */}
          {metaProgress !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className={cn('text-xs font-medium', s.label)}>Meta mensal</p>
                <p className={cn('text-xs font-semibold', s.value)}>{metaProgress.toFixed(0)}%</p>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500 rounded-full', s.progressBar)}
                  style={{ width: `${metaProgress}%` }}
                  aria-hidden
                />
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita: Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-full lg:w-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={80}>
              <LineChart
                data={sparklineData}
                margin={{ top: 5, right: 10, left: -30, bottom: 0 }}
              >
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={key === 'positive' ? '#10b981' : key === 'negative' ? '#ef4444' : '#9ca3af'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className={cn('text-[10px] sm:text-xs font-medium mt-1', s.label)}>Últimos 6 meses</p>
          </div>
        )}

        {/* Badge com período */}
        <span
          className={cn(
            'self-start lg:self-auto px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium shrink-0',
            s.badge,
          )}
        >
          {periodoLabel}
        </span>
      </div>
    </div>
  )
}
