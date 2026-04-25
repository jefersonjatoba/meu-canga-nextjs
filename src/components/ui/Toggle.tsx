'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  id?: string
}

export function Toggle({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id,
}: ToggleProps) {
  const inputId = id ?? React.useId()

  const trackSize = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const thumbSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
  const thumbTranslate = size === 'sm' ? 'translate-x-4' : 'translate-x-5'

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex items-start gap-3 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="relative shrink-0 mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only"
          aria-checked={checked}
        />
        {/* Track */}
        <span
          aria-hidden
          className={cn(
            'block rounded-full transition-colors duration-200',
            trackSize,
            checked ? 'bg-accent-blue' : 'bg-gray-300 dark:bg-gray-600',
            !disabled && 'group-hover:opacity-90'
          )}
        />
        {/* Thumb */}
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 -translate-y-1/2 left-[3px]',
            'block rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-in-out',
            thumbSize,
            checked ? thumbTranslate : 'translate-x-0'
          )}
        />
      </div>

      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  )
}
