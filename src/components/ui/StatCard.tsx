'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string
  subtext?: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  iconBg?: string
  accentColor?: 'blue' | 'green' | 'red' | 'amber' | 'purple'
  isLoading?: boolean
  className?: string
}

const accentMap = {
  blue: {
    value: 'text-accent-blue',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-accent-blue',
  },
  green: {
    value: 'text-accent-green',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-accent-green',
  },
  red: {
    value: 'text-error',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-error',
  },
  amber: {
    value: 'text-accent-orange',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-accent-orange',
  },
  purple: {
    value: 'text-purple-500',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-500',
  },
}

export function StatCard({
  title,
  value,
  subtext,
  trend,
  trendLabel,
  icon,
  accentColor = 'blue',
  isLoading = false,
  className,
}: StatCardProps) {
  const accent = accentMap[accentColor]

  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0
  const trendNeutral = trend !== undefined && trend === 0

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700/60',
        'bg-white dark:bg-[#1E1E1E]',
        'shadow-sm p-6',
        'flex flex-col gap-3',
        className
      )}
    >
      {/* Top row: title + icon */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        {icon && (
          <span
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
              accent.iconBg,
              accent.iconColor
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      ) : (
        <>
          <p className={cn('text-2xl font-bold tracking-tight', accent.value)}>
            {value}
          </p>

          {/* Trend + subtext */}
          <div className="flex items-center gap-2 flex-wrap">
            {trend !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
                  trendPositive && 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
                  trendNegative && 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
                  trendNeutral && 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
                )}
                aria-label={`Variação: ${trend > 0 ? '+' : ''}${trend}%`}
              >
                {trendPositive && <TrendingUp size={12} aria-hidden />}
                {trendNegative && <TrendingDown size={12} aria-hidden />}
                {trendNeutral && <Minus size={12} aria-hidden />}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
            {subtext && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trendLabel ?? subtext}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
