import Link from 'next/link'
import { CreditCard, CalendarClock } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import type { CreditCardDashboardSummaryDTO } from '@/features/dashboard/types'
import { MetricCard } from './MetricCard'

interface CreditCardOverviewProps {
  summary: CreditCardDashboardSummaryDTO
}

export function CreditCardOverview({ summary }: CreditCardOverviewProps) {
  if (summary.totalCartoes === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700/60 dark:bg-[#1E1E1E]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Cartoes</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nenhum cartao de credito ativo cadastrado.
            </p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Configurar cartao
          </Link>
        </div>
      </div>
    )
  }

  const proxima = summary.proximaFatura

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          title="Faturas abertas"
          value={formatBRL(summary.valorFaturasAbertasCentavos)}
          description={
            proxima
              ? `${summary.totalFaturasAbertas} aberta(s) - proxima em ${formatDateBR(proxima.dataVencimento)}`
              : 'Nenhuma fatura em aberto'
          }
          tone={summary.valorFaturasAbertasCentavos > 0 ? 'warning' : 'neutral'}
          icon={<CalendarClock size={16} />}
        />
        <MetricCard
          title="Limite disponivel"
          value={formatBRL(summary.limiteDisponivelCentavos)}
          description={`${formatBRL(summary.limiteUsadoCentavos)} usado de ${formatBRL(summary.totalLimiteCentavos)}`}
          tone={summary.limiteDisponivelCentavos > 0 ? 'info' : 'warning'}
          icon={<CreditCard size={16} />}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700/60 dark:bg-[#1E1E1E]">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Faturas proximas
            </h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Resumo operacional; despesas ja entram por parcela nos lancamentos.
            </p>
          </div>
          <Link
            href="/dashboard/cartoes"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Gerenciar faturas
          </Link>
        </div>

        {summary.faturasProximas.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
            Nenhuma fatura aberta no momento.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/40">
            {summary.faturasProximas.slice(0, 5).map(fatura => (
              <li key={fatura.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {fatura.contaNome} - {fatura.competencia}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Vence em {formatDateBR(fatura.dataVencimento)} - {fatura.status}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {formatBRL(fatura.totalCentavos)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
