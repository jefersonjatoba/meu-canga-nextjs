import { Plus } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import type { LancamentoSummaryDTO } from '@/features/lancamentos/types'

interface LancamentosHeaderProps {
  periodoLabel: string
  summary?: LancamentoSummaryDTO | null
  onNovo: () => void
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'positive' | 'negative' | 'neutral'
}) {
  const colorMap = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-500 dark:text-red-400',
    neutral:  'text-gray-700 dark:text-gray-200',
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${colorMap[tone]}`}>{value}</span>
    </div>
  )
}

export function LancamentosHeader({ periodoLabel, summary, onNovo }: LancamentosHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lançamentos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Movimentações de{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{periodoLabel}</span>
          </p>
        </div>
        <button
          onClick={onNovo}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={15} aria-hidden />
          Novo lançamento
        </button>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="flex flex-wrap gap-6 px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm">
          <SummaryChip
            label="Receitas"
            value={formatBRL(summary.totalIncome)}
            tone="positive"
          />
          <SummaryChip
            label="Despesas"
            value={formatBRL(summary.totalExpense)}
            tone="negative"
          />
          <SummaryChip
            label="Saldo"
            value={formatBRL(summary.balance)}
            tone={summary.balance >= 0 ? 'positive' : 'negative'}
          />
          <SummaryChip
            label="Taxa de poupança"
            value={`${summary.savingsRate.toFixed(1)}%`}
            tone={summary.savingsRate >= 20 ? 'positive' : 'neutral'}
          />
        </div>
      )}
    </div>
  )
}
