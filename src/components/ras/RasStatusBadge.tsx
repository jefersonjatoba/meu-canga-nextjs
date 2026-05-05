'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { RAS_STATUS_LABELS } from '@/types/ras'
import type { StatusRas } from '@/types/ras'

interface RasStatusBadgeProps {
  status: StatusRas
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
}

const statusColorClasses: Record<StatusRas, string> = {
  agendado:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  realizado:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  pendente:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  confirmado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  cancelado:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

export function RasStatusBadge({ status, size = 'md', className }: RasStatusBadgeProps) {
  const label = RAS_STATUS_LABELS[status]
  const colorClasses = statusColorClasses[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  )
}

export default RasStatusBadge
