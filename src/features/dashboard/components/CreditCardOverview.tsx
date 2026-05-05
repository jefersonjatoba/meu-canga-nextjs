import Link from 'next/link'
import { CreditCard, CalendarClock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import type { CreditCardDashboardSummaryDTO } from '@/features/dashboard/types'
import { MetricCard } from './MetricCard'

interface CreditCardOverviewProps {
  summary: CreditCardDashboardSummaryDTO
}

function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getStatusBadge(daysUntilDue: number): { label: string; color: string; bgColor: string } {
  if (daysUntilDue <= 0) {
    return { label: 'PAGAR HOJE', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-500/10' }
  }
  if (daysUntilDue === 1) {
    return { label: 'VENCE AMANHÃ', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/10' }
  }
  if (daysUntilDue <= 5) {
    return { label: `VENCE EM ${daysUntilDue}D`, color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/10' }
  }
  return { label: 'EM DIA', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/10' }
}

function getLimitColor(percentual: number): string {
  if (percentual >= 90) return 'bg-red-500'
  if (percentual >= 70) return 'bg-orange-500'
  return 'bg-emerald-500'
}

export function CreditCardOverview({ summary }: CreditCardOverviewProps) {
  if (summary.totalCartoes === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Cartoes</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nenhum cartao de credito ativo cadastrado.
            </p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Configurar cartao
          </Link>
        </div>
      </div>
    )
  }

  const proxima = summary.proximaFatura
  const limitPercentual = summary.totalLimiteCentavos > 0
    ? (summary.limiteUsadoCentavos / summary.totalLimiteCentavos) * 100
    : 0

  return (
    <div className="space-y-3">
      {/* Fatura mais urgente em destaque */}
      {proxima && (
        <div className={cn(
          'rounded-xl border shadow-sm p-5 flex flex-col gap-4',
          getDaysUntilDue(proxima.dataVencimento) <= 5
            ? 'border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5'
            : 'border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C]'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                Próxima Fatura
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {proxima.contaNome}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatBRL(proxima.totalCentavos)}
              </p>
            </div>
            <div className="text-right">
              <div className={cn(
                'inline-block px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap mb-2',
                getStatusBadge(getDaysUntilDue(proxima.dataVencimento)).bgColor,
                getStatusBadge(getDaysUntilDue(proxima.dataVencimento)).color
              )}>
                {getStatusBadge(getDaysUntilDue(proxima.dataVencimento)).label}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formatDateBR(proxima.dataVencimento)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Limite de Gastos - Barra colorida */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Limite Disponível</h3>
          <span className={cn(
            'text-sm font-bold tabular-nums',
            limitPercentual >= 80 ? 'text-red-600 dark:text-red-400' :
            limitPercentual >= 60 ? 'text-orange-600 dark:text-orange-400' :
            'text-emerald-600 dark:text-emerald-400'
          )}>
            {formatBRL(summary.limiteDisponivelCentavos)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                getLimitColor(limitPercentual)
              )}
              style={{ width: `${Math.min(limitPercentual, 100)}%` }}
              aria-hidden
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {formatBRL(summary.limiteUsadoCentavos)} usado
            </span>
            <span>
              {limitPercentual.toFixed(0)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Limite total: {formatBRL(summary.totalLimiteCentavos)}
        </p>
      </div>

      {/* Faturas próximas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Faturas próximas
            </h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Resumo operacional; despesas ja entram por parcela nos lancamentos.
            </p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Gerenciar faturas
          </Link>
        </div>

        {summary.faturasProximas.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
            Nenhuma fatura aberta no momento.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {summary.faturasProximas.slice(0, 5).map(fatura => {
              const daysUntil = getDaysUntilDue(fatura.dataVencimento)
              const badge = getStatusBadge(daysUntil)

              return (
                <li key={fatura.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                        {fatura.contaNome} - {fatura.competencia}
                      </p>
                      {daysUntil <= 5 && (
                        <AlertCircle size={14} className="text-orange-500 dark:text-orange-400 flex-shrink-0" aria-hidden />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateBR(fatura.dataVencimento)}
                      </p>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap',
                        badge.bgColor,
                        badge.color
                      )}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100 sm:text-right">
                    {formatBRL(fatura.totalCentavos)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
