import { cn } from '@/lib/utils'

export type MetricCardTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info'

export interface MetricCardProps {
  title: string
  value: string
  description?: string
  tone?: MetricCardTone
}

const toneValue: Record<MetricCardTone, string> = {
  neutral:  'text-gray-800 dark:text-gray-100',
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  warning:  'text-amber-600 dark:text-amber-400',
  info:     'text-blue-600 dark:text-blue-400',
}

const toneBorder: Record<MetricCardTone, string> = {
  neutral:  'border-gray-200 dark:border-gray-700/60',
  positive: 'border-green-200 dark:border-green-800/40',
  negative: 'border-red-200 dark:border-red-800/40',
  warning:  'border-amber-200 dark:border-amber-800/40',
  info:     'border-blue-200 dark:border-blue-800/40',
}

export function MetricCard({ title, value, description, tone = 'neutral' }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white dark:bg-[#1E1E1E] shadow-sm p-5 flex flex-col gap-2',
        toneBorder[tone],
      )}
    >
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className={cn('text-2xl font-bold tracking-tight tabular-nums', toneValue[tone])}>
        {value}
      </p>
      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{description}</p>
      )}
    </div>
  )
}
