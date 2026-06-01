import Link from 'next/link'
import { AlertCircle, ArrowRight, CreditCard, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import type { CreditCardDashboardSummaryDTO } from '@/features/dashboard/types'

interface CreditCardOverviewProps {
  summary: CreditCardDashboardSummaryDTO
}

function getDaysUntilDue(dueDate: Date | string): number {
  const dueStr = typeof dueDate === 'string' ? dueDate.slice(0, 10) : dueDate.toISOString().slice(0, 10)
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const due = new Date(`${dueStr}T00:00:00Z`)
  const today = new Date(`${todayStr}T00:00:00Z`)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getStatusBadge(daysUntilDue: number): { label: string; color: string; bgColor: string } {
  if (daysUntilDue <= 0) {
    return { label: 'Pagar hoje', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-500/10' }
  }
  if (daysUntilDue === 1) {
    return { label: 'Vence amanhã', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/10' }
  }
  if (daysUntilDue <= 5) {
    return { label: `${daysUntilDue} dias`, color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/10' }
  }
  return { label: 'Em dia', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/10' }
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
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Cartões</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nenhum cartão de crédito ativo cadastrado.
            </p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Configurar cartão
          </Link>
        </div>
      </div>
    )
  }

  const proxima = summary.proximaFatura
  const limitPercentual =
    summary.totalLimiteCentavos > 0
      ? (summary.limiteUsadoCentavos / summary.totalLimiteCentavos) * 100
      : 0

  const outrasFaturas = proxima
    ? summary.faturasProximas.filter((fatura) => fatura.id !== proxima.id)
    : summary.faturasProximas

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div
          className={cn(
            'rounded-xl border p-5 shadow-sm',
            proxima && getDaysUntilDue(proxima.dataVencimento) <= 5
              ? 'border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5'
              : 'border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#1C1C1C]',
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                <CreditCard size={16} aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Próxima fatura
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {proxima ? proxima.contaNome : 'Sem fatura aberta'}
                </p>
              </div>
            </div>

            {proxima && (
              <span
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap',
                  getStatusBadge(getDaysUntilDue(proxima.dataVencimento)).bgColor,
                  getStatusBadge(getDaysUntilDue(proxima.dataVencimento)).color,
                )}
              >
                {getStatusBadge(getDaysUntilDue(proxima.dataVencimento)).label}
              </span>
            )}
          </div>

          {proxima ? (
            <div className="space-y-2">
              <p className="text-2xl font-black tracking-tight tabular-nums text-gray-900 dark:text-gray-100">
                {formatBRL(proxima.totalCentavos)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Competência {proxima.competencia} • vencimento em {formatDateBR(proxima.dataVencimento)}
              </p>
              <Link
                href="/dashboard/cartoes"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition-opacity hover:opacity-80 dark:text-violet-400"
              >
                Abrir cartão
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma fatura aberta no momento.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Wallet size={16} aria-hidden />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Limite disponível
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {summary.totalCartoes} {summary.totalCartoes === 1 ? 'cartão ativo' : 'cartões ativos'}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'text-xs font-semibold',
                limitPercentual >= 80
                  ? 'text-red-600 dark:text-red-400'
                  : limitPercentual >= 60
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-emerald-600 dark:text-emerald-400',
              )}
            >
              {limitPercentual.toFixed(0)}% em uso
            </span>
          </div>

          <p className="text-2xl font-black tracking-tight tabular-nums text-gray-900 dark:text-gray-100">
            {formatBRL(summary.limiteDisponivelCentavos)}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatBRL(summary.limiteUsadoCentavos)} já ocupados do total de {formatBRL(summary.totalLimiteCentavos)}.
          </p>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.08]">
            <div
              className={cn('h-full rounded-full transition-all duration-500', getLimitColor(limitPercentual))}
              style={{ width: `${Math.min(limitPercentual, 100)}%` }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Radar de faturas</h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              A home mostra o que vence agora. As demais competências ficam detalhadas em Cartões.
            </p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            Ver todas
          </Link>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          {outrasFaturas.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              O restante do ciclo está tranquilo. Quando surgir outra fatura relevante, ela aparece aqui.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <AlertCircle size={16} className="text-orange-500 dark:text-orange-400" aria-hidden />
                <span>
                  {outrasFaturas.length} {outrasFaturas.length === 1 ? 'fatura adicional aberta' : 'faturas adicionais abertas'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {outrasFaturas.slice(0, 2).map((fatura) => (
                  <span
                    key={fatura.id}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
                  >
                    {fatura.contaNome}
                    <span className="font-semibold">{formatDateBR(fatura.dataVencimento)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
