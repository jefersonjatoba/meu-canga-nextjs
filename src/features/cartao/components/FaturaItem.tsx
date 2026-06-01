'use client'

import { AlertTriangle, CalendarDays, CheckCircle2, Eye, WalletCards } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import type { FaturaCartaoDTO } from '../types'

interface FaturaItemProps {
  fatura: FaturaCartaoDTO
  onDetalhe: (fatura: FaturaCartaoDTO) => void
  onPagar: (fatura: FaturaCartaoDTO) => void
}

const statusVariant: Record<string, BadgeVariant> = {
  aberta: 'outline',
  fechada: 'warning',
  paga: 'success',
  vencida: 'error',
  cancelada: 'default',
}

export function FaturaItem({ fatura, onDetalhe, onPagar }: FaturaItemProps) {
  const podePagar = fatura.status !== 'paga' && fatura.status !== 'cancelada' && fatura.totalCentavos > 0
  const due = getDueState(fatura)
  const StatusIcon = due.icon

  return (
    <div className={cn(
      'rounded-xl border bg-white p-4 shadow-sm transition-colors dark:bg-[#1A1A1A]',
      due.cardClass,
    )}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {fatura.conta?.nome ?? 'Cartão'} - {fatura.competencia}
            </h3>
            <Badge variant={due.variant ?? statusVariant[fatura.status] ?? 'default'} dot>
              {due.statusLabel}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className={cn('inline-flex items-center gap-1.5 font-medium', due.textClass)}>
              <StatusIcon size={15} aria-hidden />
              {due.label}
              <span className="font-normal text-gray-400 dark:text-gray-500">
                ({formatDate(fatura.dataVencimento)})
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <WalletCards size={15} aria-hidden />
              {fatura._count?.parcelas ?? 0} parcela{(fatura._count?.parcelas ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-[140px] text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatBRL(fatura.totalCentavos)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onDetalhe(fatura)}>
              <Eye size={15} className="mr-1.5" aria-hidden />
              Detalhe
            </Button>
            <Button variant="primary" size="sm" disabled={!podePagar} onClick={() => onPagar(fatura)}>
              Registrar pagamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

function getDueState(fatura: FaturaCartaoDTO): {
  label: string
  statusLabel: string
  variant: BadgeVariant
  textClass: string
  cardClass: string
  icon: typeof CalendarDays
} {
  if (fatura.status === 'paga') {
    return {
      label: 'Fatura paga',
      statusLabel: 'paga',
      variant: 'success',
      textClass: 'text-green-600 dark:text-green-400',
      cardClass: 'border-green-200 hover:border-green-300 dark:border-green-900/50',
      icon: CheckCircle2,
    }
  }

  const days = daysUntil(fatura.dataVencimento)
  const isOverdue = fatura.status === 'vencida' || days < 0

  if (isOverdue) {
    return {
      label: `vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`,
      statusLabel: 'vencida',
      variant: 'error',
      textClass: 'text-red-600 dark:text-red-400',
      cardClass: 'border-red-200 hover:border-red-300 dark:border-red-900/50',
      icon: AlertTriangle,
    }
  }

  if (days === 0) {
    return {
      label: 'vence hoje',
      statusLabel: fatura.status,
      variant: 'warning',
      textClass: 'text-amber-600 dark:text-amber-400',
      cardClass: 'border-amber-200 hover:border-amber-300 dark:border-amber-900/50',
      icon: AlertTriangle,
    }
  }

  if (days === 1) {
    return {
      label: 'vence amanhã',
      statusLabel: fatura.status,
      variant: 'warning',
      textClass: 'text-amber-600 dark:text-amber-400',
      cardClass: 'border-amber-200 hover:border-amber-300 dark:border-amber-900/50',
      icon: AlertTriangle,
    }
  }

  if (days <= 3) {
    return {
      label: `vence em ${days} dias`,
      statusLabel: fatura.status,
      variant: 'warning',
      textClass: 'text-amber-600 dark:text-amber-400',
      cardClass: 'border-amber-200 hover:border-amber-300 dark:border-amber-900/50',
      icon: AlertTriangle,
    }
  }

  return {
    label: `vence em ${days} dias`,
    statusLabel: fatura.status,
    variant: statusVariant[fatura.status] ?? 'outline',
    textClass: 'text-gray-500 dark:text-gray-400',
    cardClass: 'border-gray-200 hover:border-blue-200 dark:border-white/[0.06] dark:hover:border-blue-900/60',
    icon: CalendarDays,
  }
}

function daysUntil(value: string) {
  const due = parseUTCDateOnly(value)
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((due.getTime() - today) / 86_400_000)
}

function parseUTCDateOnly(value: string) {
  const date = new Date(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}
