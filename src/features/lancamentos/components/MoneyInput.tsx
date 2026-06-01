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

// Formats raw digit+comma string into BRL display format.
// "1234" → "1.234"   "1234,5" → "1.234,5"   "1234,56" → "1.234,56"
function formatBRLDisplay(raw: string): string {
  // Strip everything except digits and one comma
  const onlyDigitsComma = raw.replace(/[^\d,]/g, '')
  const commaIdx = onlyDigitsComma.indexOf(',')

  let intPart: string
  let decPart: string | undefined

  if (commaIdx !== -1) {
    intPart = onlyDigitsComma.slice(0, commaIdx)
    // max 2 decimal digits
    decPart = onlyDigitsComma.slice(commaIdx + 1, commaIdx + 3)
  } else {
    intPart = onlyDigitsComma
    decPart = undefined
  }

  // Thousand separators with dots
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return decPart !== undefined ? `${intFormatted},${decPart}` : intFormatted
}

// Strip BRL display formatting so toCents() can parse it.
// "1.234,56" → "1234,56"  (toCents replaces ',' → '.' then parseFloat)
export function stripMoneyFormat(display: string): string {
  return display.replace(/\./g, '')
}

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
          const raw = e.target.value.replace(/[^\d,]/g, '')
          const formatted = formatBRLDisplay(raw)
          onChange?.(formatted)
        }}
        onBlur={onBlur}
      />
    )
  },
)
MoneyInput.displayName = 'MoneyInput'
