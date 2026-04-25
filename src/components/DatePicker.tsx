'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-precision-black mb-2">
            {label}
          </label>
        )}
        <input
          type="date"
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
            error && 'border-error focus:ring-error',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'
