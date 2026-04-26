'use client'

import { Loader2 } from 'lucide-react'
import { LancamentoItem } from './LancamentoItem'
import { LancamentosEmptyState } from './LancamentosEmptyState'
import type { LancamentoAPIItem } from '../api'

interface LancamentosListProps {
  items: LancamentoAPIItem[]
  total: number
  loading: boolean
  error: string | null
  onDelete: (id: string) => void
  onNovo: () => void
}

export function LancamentosList({
  items,
  total,
  loading,
  error,
  onDelete,
  onNovo,
}: LancamentosListProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm">
        <div className="px-5 py-10 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" aria-hidden />
          <p className="text-sm">Carregando lançamentos…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-5 py-8 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return <LancamentosEmptyState onNovo={onNovo} />
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lançamentos</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {total} {total === 1 ? 'lançamento' : 'lançamentos'}
        </span>
      </div>
      <ul>
        {items.map((item, idx) => (
          <LancamentoItem
            key={item.id}
            item={item}
            onDelete={onDelete}
            isLast={idx === items.length - 1}
          />
        ))}
      </ul>
    </div>
  )
}
