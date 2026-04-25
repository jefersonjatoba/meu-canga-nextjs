'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: ProgressVariant
  label?: string
  showValue?: boolean
  valueFormat?: (value: number, max: number) => string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

const variantTrack: Record<ProgressVariant, string> = {
  default: 'bg-accent-blue',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  label,
  showValue = false,
  valueFormat,
  size = 'md',
  className,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const displayValue = valueFormat
    ? valueFormat(value, max)
    : `${Math.round(pct)}%`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
              {displayValue}
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn(
          'w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            variantTrack[variant],
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
