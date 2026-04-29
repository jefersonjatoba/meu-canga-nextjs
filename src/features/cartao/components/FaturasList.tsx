'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { CartoesEmptyState } from './CartoesEmptyState'
import { FaturaItem } from './FaturaItem'
import type { FaturaCartaoDTO } from '../types'

interface FaturasListProps {
  faturas: FaturaCartaoDTO[]
  loading: boolean
  error: string | null
  hasCartoes: boolean
  onDetalhe: (fatura: FaturaCartaoDTO) => void
  onPagar: (fatura: FaturaCartaoDTO) => void
  onNovaCompra: () => void
}

export function FaturasList({
  faturas,
  loading,
  error,
  hasCartoes,
  onDetalhe,
  onPagar,
  onNovaCompra,
}: FaturasListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(item => (
          <Skeleton key={item} className="h-[112px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800/40 dark:bg-red-950/20">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!hasCartoes) return <CartoesEmptyState variant="sem-cartoes" />
  if (faturas.length === 0) return <CartoesEmptyState variant="sem-faturas" onNovaCompra={onNovaCompra} />

  return (
    <div className="space-y-3">
      {faturas.map(fatura => (
        <FaturaItem key={fatura.id} fatura={fatura} onDetalhe={onDetalhe} onPagar={onPagar} />
      ))}
    </div>
  )
}
