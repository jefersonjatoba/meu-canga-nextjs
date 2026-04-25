'use client'

import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
  indeterminate?: boolean
  size?: 'sm' | 'md'
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      indeterminate = false,
      size = 'md',
      error,
      id,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const hasError = !!error
    const isCheckedOrIndeterminate = checked || indeterminate

    const boxSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    const iconSize = size === 'sm' ? 10 : 12

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'flex items-start gap-2.5 cursor-pointer group',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {/* Hidden native checkbox (accessible) */}
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className="sr-only"
            aria-invalid={hasError}
            {...props}
          />

          {/* Visual checkbox */}
          <span
            aria-hidden
            className={cn(
              'flex shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150',
              boxSize,
              isCheckedOrIndeterminate
                ? 'bg-accent-blue border-accent-blue'
                : 'bg-white dark:bg-[#1E1E1E] border-gray-300 dark:border-gray-600',
              hasError && !isCheckedOrIndeterminate && 'border-error',
              !disabled && 'group-hover:border-accent-blue'
            )}
          >
            {indeterminate ? (
              <Minus size={iconSize} className="text-white" strokeWidth={3} />
            ) : checked ? (
              <Check size={iconSize} className="text-white" strokeWidth={3} />
            ) : null}
          </span>

          {/* Label text */}
          {label && (
            <span className="flex flex-col gap-0.5 mt-px">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
              </span>
              {description && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {description}
                </span>
              )}
            </span>
          )}
        </label>

        {hasError && (
          <p role="alert" className="text-xs text-error ml-7">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
