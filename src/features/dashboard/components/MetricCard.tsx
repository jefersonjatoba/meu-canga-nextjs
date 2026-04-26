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
    border:    'border-gray-200 dark:border-gray-700/60',
    iconBg:    'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-500 dark:text-gray-400',
  },
  positive: {
    value:     'text-green-600 dark:text-green-400',
    border:    'border-green-200 dark:border-green-800/40',
    iconBg:    'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  negative: {
    value:     'text-red-600 dark:text-red-400',
    border:    'border-red-200 dark:border-red-800/40',
    iconBg:    'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  warning: {
    value:     'text-amber-600 dark:text-amber-400',
    border:    'border-amber-200 dark:border-amber-800/40',
    iconBg:    'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    value:     'text-blue-600 dark:text-blue-400',
    border:    'border-blue-200 dark:border-blue-800/40',
    iconBg:    'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
}

export function MetricCard({ title, value, description, tone = 'neutral', icon }: MetricCardProps) {
  const s = toneStyle[tone]

  return (
    <div
      className={cn(
        'rounded-xl border bg-white dark:bg-[#1E1E1E] shadow-sm p-5 flex flex-col gap-3',
        s.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">
          {title}
        </p>
        {icon && (
          <span
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              s.iconBg,
              s.iconColor,
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      <p className={cn('text-2xl font-bold tracking-tight tabular-nums', s.value)}>{value}</p>

      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug -mt-1">
          {description}
        </p>
      )}
    </div>
  )
}
