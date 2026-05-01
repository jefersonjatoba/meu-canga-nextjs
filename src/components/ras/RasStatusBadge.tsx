'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { RAS_STATUS_COLORS, RAS_STATUS_LABELS } from '@/types/ras'
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

export function RasStatusBadge({ status, size = 'md', className }: RasStatusBadgeProps) {
  const colors = RAS_STATUS_COLORS[status]
  const label = RAS_STATUS_LABELS[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{ color: colors.color, background: colors.bg }}
    >
      {label}
    </span>
  )
}

export default RasStatusBadge
