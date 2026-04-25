'use client'

import * as React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  helper?: string
  disabled?: boolean
  required?: boolean
  id?: string
  fullWidth?: boolean
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Selecionar...',
  label,
  error,
  helper,
  disabled,
  required,
  id,
  fullWidth = true,
}: SelectProps) {
  const inputId = id ?? React.useId()
  const hasError = !!error

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium',
            hasError ? 'text-error' : 'text-gray-700 dark:text-gray-300',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
          {required && <span className="ml-1 text-error" aria-hidden>*</span>}
        </label>
      )}

      <RadixSelect.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={inputId}
          aria-invalid={hasError}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2.5',
            'text-sm text-gray-900 placeholder:text-gray-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'dark:bg-[#1E1E1E] dark:text-gray-100',
            !hasError
              ? 'border-gray-300 dark:border-gray-600 focus:ring-accent-blue focus:border-accent-blue'
              : 'border-error focus:ring-error',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            '[&[data-placeholder]]:text-gray-400 dark:[&[data-placeholder]]:text-gray-500'
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <ChevronDown size={16} className="text-gray-400 shrink-0" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={cn(
              'relative z-50 min-w-[8rem] overflow-hidden rounded-xl border shadow-lg',
              'bg-white dark:bg-[#1E1E1E]',
              'border-gray-200 dark:border-gray-700',
              'animate-in fade-in-0 zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.ScrollUpButton className="flex cursor-pointer items-center justify-center py-1 text-gray-400">
              <ChevronUp size={14} />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2',
                    'text-sm text-gray-900 dark:text-gray-100',
                    'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                    'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
                    'transition-colors duration-100'
                  )}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-3">
                    <Check size={14} className="text-accent-blue" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex cursor-pointer items-center justify-center py-1 text-gray-400">
              <ChevronDown size={14} />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {hasError && (
        <p role="alert" className="text-xs text-error">{error}</p>
      )}
      {helper && !hasError && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  )
}
