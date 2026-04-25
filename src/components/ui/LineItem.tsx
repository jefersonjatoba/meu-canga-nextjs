'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './Badge'

export interface LineItemProps {
  icon?: React.ReactNode
  iconBg?: string
  title: string
  subtitle?: string
  amount: string
  amountType?: 'credit' | 'debit' | 'neutral'
  badge?: string
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  date?: string
  onClick?: () => void
  className?: string
}

export function LineItem({
  icon,
  iconBg = 'bg-gray-100 dark:bg-gray-800',
  title,
  subtitle,
  amount,
  amountType = 'neutral',
  badge,
  badgeVariant = 'default',
  date,
  onClick,
  className,
}: LineItemProps) {
  const amountColors = {
    credit: 'text-success',
    debit: 'text-error',
    neutral: 'text-gray-900 dark:text-gray-100',
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'flex items-center gap-3 py-3 px-4',
        'border-b border-gray-100 dark:border-gray-700/50 last:border-0',
        onClick &&
          'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors duration-150',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <span
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
            iconBg
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {title}
          </p>
          {badge && <Badge variant={badgeVariant} size="sm">{badge}</Badge>}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-semibold tabular-nums', amountColors[amountType])}>
          {amountType === 'credit' && '+'}
          {amountType === 'debit' && '-'}
          {amount}
        </p>
        {date && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{date}</p>
        )}
      </div>
    </div>
  )
}
