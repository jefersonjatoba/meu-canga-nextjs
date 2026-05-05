import { formatBRL } from '@/lib/money'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinancialHeroCardProps {
  saldoOperacionalCentavos: number
  periodoLabel: string
}

const styles = {
  positive: {
    bg:      'bg-gradient-to-br from-green-50 via-emerald-50/60 to-white dark:from-emerald-500/[0.08] dark:via-emerald-500/[0.04] dark:to-[#1C1C1C]',
    border:  'border-green-200 dark:border-emerald-500/20',
    label:   'text-green-700 dark:text-emerald-400',
    value:   'text-green-600 dark:text-emerald-300',
    badge:   'bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-400',
    message: 'Você está no positivo este mês.',
    Icon:    TrendingUp,
  },
  negative: {
    bg:      'bg-gradient-to-br from-red-50 via-rose-50/60 to-white dark:from-red-500/[0.08] dark:via-red-500/[0.04] dark:to-[#1C1C1C]',
    border:  'border-red-200 dark:border-red-500/20',
    label:   'text-red-700 dark:text-red-400',
    value:   'text-red-600 dark:text-red-400',
    badge:   'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
    message: 'Atenção: saldo operacional negativo.',
    Icon:    TrendingDown,
  },
  neutral: {
    bg:      'bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.03] dark:to-[#1C1C1C]',
    border:  'border-gray-200 dark:border-white/[0.08]',
    label:   'text-gray-500 dark:text-gray-400',
    value:   'text-gray-800 dark:text-gray-100',
    badge:   'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
    message: 'Nenhum lançamento confirmado ainda.',
    Icon:    Minus,
  },
}

export function FinancialHeroCard({ saldoOperacionalCentavos, periodoLabel }: FinancialHeroCardProps) {
  const key =
    saldoOperacionalCentavos > 0 ? 'positive'
    : saldoOperacionalCentavos < 0 ? 'negative'
    : 'neutral'
  const s = styles[key]
  const { Icon } = s

  return (
    <div className={cn('rounded-2xl border shadow-sm p-4 sm:p-6 lg:p-8', s.bg, s.border)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <p className={cn('text-[10px] sm:text-xs font-semibold uppercase tracking-widest', s.label)}>
            Saldo Operacional
          </p>
          <p className={cn('text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight tabular-nums', s.value)}>
            {formatBRL(saldoOperacionalCentavos)}
          </p>
          <div className="flex items-center gap-1.5">
            <Icon size={13} className={s.label} aria-hidden />
            <p className={cn('text-xs sm:text-sm', s.label)}>{s.message}</p>
          </div>
        </div>

        <span
          className={cn(
            'self-start sm:self-auto px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium shrink-0',
            s.badge,
          )}
        >
          {periodoLabel}
        </span>
      </div>
    </div>
  )
}
