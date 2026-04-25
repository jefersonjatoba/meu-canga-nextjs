'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-accent-blue text-white hover:bg-blue-600 active:bg-blue-700',
      secondary: 'bg-light-gray text-precision-black hover:bg-gray-300 active:bg-gray-400',
      danger: 'bg-error text-white hover:bg-red-600 active:bg-red-700',
      ghost: 'text-accent-blue hover:bg-blue-50 active:bg-blue-100',
    }

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="inline-block mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
            Carregando...
          </>
        ) : (
          props.children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
