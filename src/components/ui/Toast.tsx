'use client'

import * as React from 'react'
import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, duration: 5000, ...opts }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Viewport ─────────────────────────────────────────────────────────────────

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notificações"
      className="fixed bottom-4 right-4 z-[600] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

const toastConfig: Record<
  ToastType,
  { icon: React.ElementType; bg: string; border: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white dark:bg-[#1E1E1E]',
    border: 'border-green-200 dark:border-green-800',
    iconClass: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-white dark:bg-[#1E1E1E]',
    border: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-500',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-white dark:bg-[#1E1E1E]',
    border: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-white dark:bg-[#1E1E1E]',
    border: 'border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-500',
  },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)

  const config = toastConfig[toast.type]
  const Icon = config.icon

  // Animate in
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Auto-dismiss
  useEffect(() => {
    if (!toast.duration) return
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, toast.duration)
    return () => clearTimeout(timer)
  }, [toast.duration, toast.id, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 300)
  }

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto w-80 rounded-xl border shadow-lg p-4',
        'flex items-start gap-3',
        'transition-all duration-300',
        config.bg,
        config.border,
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', config.iconClass)} aria-hidden />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar notificação"
        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
