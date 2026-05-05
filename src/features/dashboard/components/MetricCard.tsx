import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export type MetricCardTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info'

export interface MetricCardProps {
  title: string
  value: string
  description?: string
  tone?: MetricCardTone
  icon?: ReactNode
}

const toneStyle: Record<
  MetricCardTone,
  { value: string; border: string; iconBg: string; iconColor: string }
> = {
  neutral: {
    value:     'text-gray-800 dark:text-gray-100',
    border:    'border-gray-200 dark:border-white/[0.08]',
    iconBg:    'bg-gray-100 dark:bg-white/[0.06]',
    iconColor: 'text-gray-500 dark:text-gray-300',
  },
  positive: {
    value:     'text-green-600 dark:text-emerald-400',
    border:    'border-green-200 dark:border-emerald-500/20',
    iconBg:    'bg-green-100 dark:bg-emerald-500/10',
    iconColor: 'text-green-600 dark:text-emerald-400',
  },
  negative: {
    value:     'text-red-600 dark:text-red-400',
    border:    'border-red-200 dark:border-red-500/20',
    iconBg:    'bg-red-100 dark:bg-red-500/10',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  warning: {
    value:     'text-amber-600 dark:text-amber-400',
    border:    'border-amber-200 dark:border-amber-500/20',
    iconBg:    'bg-amber-100 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    value:     'text-blue-600 dark:text-blue-400',
    border:    'border-blue-200 dark:border-blue-500/20',
    iconBg:    'bg-blue-100 dark:bg-blue-500/10',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
}

export function MetricCard({ title, value, description, tone = 'neutral', icon }: MetricCardProps) {
  const s = toneStyle[tone]

  return (
    <div
      className={cn(
        'rounded-xl border bg-white dark:bg-[#1C1C1C] shadow-sm dark:shadow-none',
        'p-3 sm:p-5 flex flex-col gap-2 sm:gap-3',
        s.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">
          {title}
        </p>
        {icon && (
          <span
            className={cn(
              'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0',
              s.iconBg,
              s.iconColor,
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      <p className={cn('text-xl sm:text-2xl font-bold tracking-tight tabular-nums', s.value)}>{value}</p>

      {description && (
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-snug -mt-1">
          {description}
        </p>
      )}
    </div>
  )
}
