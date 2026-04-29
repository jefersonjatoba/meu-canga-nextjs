'use client'

import { CalendarDays, Eye, WalletCards } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/money'
import type { FaturaCartaoDTO } from '../types'

interface FaturaItemProps {
  fatura: FaturaCartaoDTO
  onDetalhe: (fatura: FaturaCartaoDTO) => void
  onPagar: (fatura: FaturaCartaoDTO) => void
}

const statusVariant: Record<string, BadgeVariant> = {
  aberta: 'primary',
  fechada: 'warning',
  paga: 'success',
  vencida: 'error',
  cancelada: 'default',
}

export function FaturaItem({ fatura, onDetalhe, onPagar }: FaturaItemProps) {
  const podePagar = fatura.status !== 'paga' && fatura.status !== 'cancelada' && fatura.totalCentavos > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 dark:border-gray-800 dark:bg-[#111111] dark:hover:border-blue-900/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {fatura.conta?.nome ?? 'Cartao'} - {fatura.competencia}
            </h3>
            <Badge variant={statusVariant[fatura.status] ?? 'default'} dot>
              {fatura.status}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} aria-hidden />
              Vence em {formatDate(fatura.dataVencimento)}
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
              Pagar
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
