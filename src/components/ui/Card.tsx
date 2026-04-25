'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover lift effect */
  hoverable?: boolean
  /** Removes internal padding — useful when children fill the card */
  flush?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, flush = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-gray-200 bg-white',
        'dark:border-gray-700/60 dark:bg-[#1E1E1E]',
        'shadow-sm',
        hoverable &&
          'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        !flush && '',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

// ─── CardHeader ───────────────────────────────────────────────────────────────

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1 p-6 pb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

// ─── CardTitle ────────────────────────────────────────────────────────────────

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight',
      'text-gray-900 dark:text-gray-100',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

// ─── CardDescription ─────────────────────────────────────────────────────────

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

// ─── CardContent ──────────────────────────────────────────────────────────────

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

// ─── CardFooter ───────────────────────────────────────────────────────────────

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center p-6 pt-0 gap-3',
      className
    )}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'
