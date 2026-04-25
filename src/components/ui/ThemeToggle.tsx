'use client'

import * as React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

export interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md'
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { resolvedTheme, toggle } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const iconSize = size === 'sm' ? 14 : 16
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-pressed={isDark}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-[#1E1E1E]',
        'text-gray-500 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'hover:text-gray-700 dark:hover:text-gray-200',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
        btnSize,
        className
      )}
    >
      <span className="transition-transform duration-300" style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(90deg)' }}>
        {isDark ? <Moon size={iconSize} /> : <Sun size={iconSize} />}
      </span>
    </button>
  )
}
