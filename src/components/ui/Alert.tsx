'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertType = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType
  title?: string
  /** If provided, renders a dismiss button */
  onDismiss?: () => void
}

const alertConfig: Record<
  AlertType,
  { icon: React.ElementType; styles: string; iconStyles: string; titleStyles: string }
> = {
  info: {
    icon: Info,
    styles: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    iconStyles: 'text-blue-500',
    titleStyles: 'text-blue-800 dark:text-blue-300',
  },
  success: {
    icon: CheckCircle2,
    styles: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    iconStyles: 'text-green-500',
    titleStyles: 'text-green-800 dark:text-green-300',
  },
  warning: {
    icon: AlertCircle,
    styles: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    iconStyles: 'text-amber-500',
    titleStyles: 'text-amber-800 dark:text-amber-300',
  },
  error: {
    icon: XCircle,
    styles: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    iconStyles: 'text-red-500',
    titleStyles: 'text-red-800 dark:text-red-300',
  },
}

export function Alert({
  type = 'info',
  title,
  onDismiss,
  className,
  children,
  ...props
}: AlertProps) {
  const config = alertConfig[type]
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-xl border p-4',
        config.styles,
        className
      )}
      {...props}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', config.iconStyles)} aria-hidden />
      <div className="flex-1 min-w-0">
        {title && (
          <AlertTitle className={config.titleStyles}>{title}</AlertTitle>
        )}
        {children}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar alerta"
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export function AlertTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm font-semibold mb-1', className)} {...props}>
      {children}
    </p>
  )
}

export function AlertDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props}>
      {children}
    </p>
  )
}
