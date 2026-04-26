import { formatBRL } from '@/lib/money'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinancialHeroCardProps {
  saldoOperacionalCentavos: number
  periodoLabel: string
}

const styles = {
  positive: {
    bg:      'bg-gradient-to-br from-green-50 via-emerald-50/60 to-white dark:from-green-950/40 dark:via-emerald-950/20 dark:to-[#1E1E1E]',
    border:  'border-green-200 dark:border-green-800/40',
    label:   'text-green-700 dark:text-green-400',
    value:   'text-green-600 dark:text-green-400',
    badge:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    message: 'Você está no positivo este mês.',
    Icon:    TrendingUp,
  },
  negative: {
    bg:      'bg-gradient-to-br from-red-50 via-rose-50/60 to-white dark:from-red-950/40 dark:via-rose-950/20 dark:to-[#1E1E1E]',
    border:  'border-red-200 dark:border-red-800/40',
    label:   'text-red-700 dark:text-red-400',
    value:   'text-red-600 dark:text-red-400',
    badge:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    message: 'Atenção: saldo operacional negativo.',
    Icon:    TrendingDown,
  },
  neutral: {
    bg:      'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/30 dark:to-[#1E1E1E]',
    border:  'border-gray-200 dark:border-gray-700/60',
    label:   'text-gray-500 dark:text-gray-400',
    value:   'text-gray-800 dark:text-gray-100',
    badge:   'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300',
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
    <div className={cn('rounded-2xl border shadow-sm p-6 sm:p-8', s.bg, s.border)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <p className={cn('text-xs font-semibold uppercase tracking-widest', s.label)}>
            Saldo Operacional
          </p>
          <p className={cn('text-4xl sm:text-5xl font-black tracking-tight tabular-nums', s.value)}>
            {formatBRL(saldoOperacionalCentavos)}
          </p>
          <div className="flex items-center gap-1.5">
            <Icon size={14} className={s.label} aria-hidden />
            <p className={cn('text-sm', s.label)}>{s.message}</p>
          </div>
        </div>

        <span
          className={cn(
            'self-start sm:self-auto px-3 py-1.5 rounded-lg text-sm font-medium shrink-0',
            s.badge,
          )}
        >
          {periodoLabel}
        </span>
      </div>
    </div>
  )
}
