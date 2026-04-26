import {
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import { TIPO_LABELS } from '@/features/lancamentos/types'
import type { RecentTransactionItem } from '@/features/dashboard/types'
import type { TipoLancamento } from '@/features/lancamentos/types'

type IconComponent = React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>

const tipoIcon: Record<TipoLancamento, IconComponent> = {
  income:             ArrowDownLeft,
  expense:            ArrowUpRight,
  ras:                Shield,
  investment_aporte:  TrendingUp,
  investment_resgate: TrendingDown,
  transfer:           ArrowLeftRight,
}

const tipoIconStyle: Record<TipoLancamento, string> = {
  income:             'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  expense:            'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
  ras:                'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  investment_aporte:  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  investment_resgate: 'bg-purple-50 dark:bg-purple-900/20 text-purple-400 dark:text-purple-300',
  transfer:           'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

const tipoValueStyle: Record<TipoLancamento, string> = {
  income:             'text-green-600 dark:text-green-400',
  expense:            'text-red-500 dark:text-red-400',
  ras:                'text-blue-600 dark:text-blue-400',
  investment_aporte:  'text-purple-600 dark:text-purple-400',
  investment_resgate: 'text-purple-400 dark:text-purple-300',
  transfer:           'text-gray-500 dark:text-gray-400',
}

const tipoSign: Record<TipoLancamento, string> = {
  income:             '+',
  expense:            '−',
  ras:                '+',
  investment_aporte:  '−',
  investment_resgate: '+',
  transfer:           '',
}

interface RecentTransactionsProps {
  items: RecentTransactionItem[]
}

export function RecentTransactions({ items }: RecentTransactionsProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/40 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Lançamentos Recentes
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {items.length === 1
              ? '1 movimentação mais recente'
              : `${items.length} movimentações mais recentes`}{' '}
            no período
          </p>
        </div>
      </div>

      <ul>
        {items.map((item, idx) => {
          const Icon = tipoIcon[item.tipo] ?? ArrowLeftRight
          return (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-5 py-4',
                idx < items.length - 1 &&
                  'border-b border-gray-100 dark:border-gray-700/40',
              )}
            >
              {/* Type icon */}
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  tipoIconStyle[item.tipo] ?? tipoIconStyle.transfer,
                )}
              >
                <Icon size={16} aria-hidden />
              </div>

              {/* Description + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {item.descricao}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDateBR(item.data)}
                  </span>
                  <span className="text-xs text-gray-200 dark:text-gray-700" aria-hidden>
                    ·
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {TIPO_LABELS[item.tipo] ?? item.tipo}
                  </span>
                  {item.categoria && (
                    <>
                      <span className="text-xs text-gray-200 dark:text-gray-700" aria-hidden>
                        ·
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {item.categoria}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Value */}
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums shrink-0',
                  tipoValueStyle[item.tipo] ?? 'text-gray-700 dark:text-gray-200',
                )}
              >
                {tipoSign[item.tipo] ?? ''}{formatBRL(item.valorCentavos)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
