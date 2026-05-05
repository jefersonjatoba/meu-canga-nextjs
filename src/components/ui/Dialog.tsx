'use client'

import * as React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Re-export primitives ─────────────────────────────────────────────────────

export const Dialog = RadixDialog.Root
export const DialogTrigger = RadixDialog.Trigger
export const DialogClose = RadixDialog.Close
export const DialogPortal = RadixDialog.Portal

// ─── Overlay ──────────────────────────────────────────────────────────────────

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RadixDialog.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'transition-all duration-300',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = RadixDialog.Overlay.displayName

// ─── Content ──────────────────────────────────────────────────────────────────

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixDialog.Content> {
  /** Hides the default close button */
  hideClose?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// Mobile: full-width with 16px side margins (calc(100% - 32px) = w-[calc(100%-2rem)])
// Desktop: constrained max-width per size
const sizeStyles = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  full: 'sm:max-w-[95vw]',
}

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  DialogContentProps
>(({ className, children, hideClose = false, size = 'md', ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <RadixDialog.Content
      ref={ref}
      className={cn(
        // Centered position
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[400]',
        // Mobile: occupy 90vw, capped at screen height
        'w-[calc(100%-2rem)] max-h-[90dvh]',
        // Shape & surface
        'rounded-2xl',
        'bg-white dark:bg-[#1C1C1C]',
        'border border-gray-200 dark:border-white/[0.10]',
        'shadow-xl',
        'p-4 sm:p-6',
        'focus:outline-none',
        // Animations
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
        'duration-200',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <RadixDialog.Close
          className={cn(
            'absolute top-3 right-3 sm:top-4 sm:right-4',
            // 44px touch target
            'h-9 w-9 flex items-center justify-center rounded-lg',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-white/[0.07]',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue'
          )}
          aria-label="Fechar"
        >
          <X size={18} />
        </RadixDialog.Close>
      )}
    </RadixDialog.Content>
  </DialogPortal>
))
DialogContent.displayName = RadixDialog.Content.displayName

// ─── Header / Title / Description / Footer ───────────────────────────────────

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1 mb-4 sm:mb-6 pr-8', className)}
      {...props}
    />
  )
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(({ className, ...props }, ref) => (
  <RadixDialog.Title
    ref={ref}
    className={cn(
      'text-xl font-semibold text-gray-900 dark:text-gray-100',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = RadixDialog.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(({ className, ...props }, ref) => (
  <RadixDialog.Description
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
))
DialogDescription.displayName = RadixDialog.Description.displayName

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4',
        'border-t border-gray-200 dark:border-white/[0.08]',
        className
      )}
      {...props}
    />
  )
}
