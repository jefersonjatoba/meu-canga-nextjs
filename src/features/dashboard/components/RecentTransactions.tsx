import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import { TIPO_LABELS } from '@/features/lancamentos/types'
import type { RecentTransactionItem } from '@/features/dashboard/types'

const tipoColor: Record<string, string> = {
  income:             'text-green-600 dark:text-green-400',
  expense:            'text-red-500 dark:text-red-400',
  ras:                'text-blue-600 dark:text-blue-400',
  investment_aporte:  'text-purple-600 dark:text-purple-400',
  investment_resgate: 'text-purple-400 dark:text-purple-300',
  transfer:           'text-gray-500 dark:text-gray-400',
}

const tipoSign: Record<string, string> = {
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
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/40">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Lançamentos Recentes
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {items.length} movimentação{items.length !== 1 ? 'ões' : ''} mais recente{items.length !== 1 ? 's' : ''} no período
        </p>
      </div>

      <ul>
        {items.map((item, idx) => (
          <li
            key={item.id}
            className={
              'flex items-center gap-3 px-5 py-3.5' +
              (idx < items.length - 1 ? ' border-b border-gray-100 dark:border-gray-700/40' : '')
            }
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {item.descricao}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDateBR(item.data)}
                </span>
                <span className="text-xs text-gray-300 dark:text-gray-600" aria-hidden>·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {TIPO_LABELS[item.tipo] ?? item.tipo}
                </span>
                {item.categoria && (
                  <>
                    <span className="text-xs text-gray-300 dark:text-gray-600" aria-hidden>·</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {item.categoria}
                    </span>
                  </>
                )}
              </div>
            </div>

            <span
              className={
                'text-sm font-semibold tabular-nums shrink-0 ' +
                (tipoColor[item.tipo] ?? 'text-gray-700 dark:text-gray-200')
              }
            >
              {tipoSign[item.tipo] ?? ''}{formatBRL(item.valorCentavos)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
