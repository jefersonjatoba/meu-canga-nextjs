'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { ContaItem } from './ContaItem'
import { ContasEmptyState } from './ContasEmptyState'
import type { ContaDTO } from '../types'

interface ContasListProps {
  contas: ContaDTO[]
  loading: boolean
  error: string | null
  onEdit: (conta: ContaDTO) => void
  onDesativar: (conta: ContaDTO) => void
  onNova: () => void
}

export function ContasList({ contas, loading, error, onEdit, onDesativar, onNova }: ContasListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-5 py-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (contas.length === 0) {
    return <ContasEmptyState onNova={onNova} />
  }

  return (
    <div className="space-y-3">
      {contas.map(conta => (
        <ContaItem
          key={conta.id}
          conta={conta}
          onEdit={onEdit}
          onDesativar={onDesativar}
        />
      ))}
    </div>
  )
}
