'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
  /** When true, expands to full container width (default: true) */
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onRightIconClick,
      fullWidth = true,
      id,
      disabled,
      required,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`
    const hasError = !!error
    const describedBy = [hasError && errorId, helper && helperId]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium',
              hasError
                ? 'text-error'
                : 'text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-error" aria-hidden>
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              aria-hidden
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className={cn(
              // Base
              'w-full rounded-lg border bg-white text-gray-900 placeholder-gray-400',
              'text-sm leading-none',
              'transition-all duration-200',
              // Dark
              'dark:bg-[#1E1E1E] dark:text-gray-100 dark:placeholder-gray-500',
              // Default border
              'border-gray-300 dark:border-gray-600',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              !hasError && 'focus:ring-accent-blue focus:border-accent-blue',
              // Error
              hasError && 'border-error focus:ring-error',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800',
              // Padding — account for icons
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              'py-2.5',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              tabIndex={onRightIconClick ? 0 : -1}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500',
                onRightIconClick
                  ? 'cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                  : 'pointer-events-none'
              )}
              aria-label={onRightIconClick ? 'Ação' : undefined}
            >
              {rightIcon}
            </button>
          )}
        </div>

        {hasError && (
          <p id={errorId} role="alert" className="text-xs text-error flex items-center gap-1">
            {error}
          </p>
        )}

        {helper && !hasError && (
          <p id={helperId} className="text-xs text-gray-500 dark:text-gray-400">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
