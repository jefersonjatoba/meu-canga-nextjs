'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/Input'

export interface MoneyInputProps {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
  id?: string
}

// Accepts only digits and comma (BRL decimal separator).
// Store value as raw string, e.g. "450,50" or "1500".
// Use toCents(value) to convert before sending to the API.

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value = '', onChange, onBlur, label, error, disabled, required, id }, ref) => {
    return (
      <Input
        ref={ref}
        id={id}
        label={label}
        error={error}
        disabled={disabled}
        required={required}
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        leftIcon={
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 select-none">
            R$
          </span>
        }
        onChange={(e) => {
          // Only allow digits and comma (Brazilian decimal separator)
          const raw = e.target.value.replace(/[^\d,]/g, '')
          onChange?.(raw)
        }}
        onBlur={onBlur}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'
