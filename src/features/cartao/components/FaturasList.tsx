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
  groupByCartao?: boolean
  isFiltered?: boolean
  onDetalhe: (fatura: FaturaCartaoDTO) => void
  onPagar: (fatura: FaturaCartaoDTO) => void
  onNovaCompra: () => void
}

export function FaturasList({
  faturas,
  loading,
  error,
  hasCartoes,
  groupByCartao = false,
  isFiltered = false,
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
  if (faturas.length === 0) {
    return (
      <CartoesEmptyState
        variant="sem-faturas"
        message={isFiltered ? 'Nenhuma fatura encontrada para este filtro.' : undefined}
        onNovaCompra={onNovaCompra}
      />
    )
  }

  if (groupByCartao) {
    const groups = groupFaturasByCartao(faturas)
    return (
      <div className="space-y-5">
        {groups.map(group => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {group.nome}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {group.faturas.length} fatura{group.faturas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {group.faturas.map(fatura => (
                <FaturaItem key={fatura.id} fatura={fatura} onDetalhe={onDetalhe} onPagar={onPagar} />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {faturas.map(fatura => (
        <FaturaItem key={fatura.id} fatura={fatura} onDetalhe={onDetalhe} onPagar={onPagar} />
      ))}
    </div>
  )
}

function groupFaturasByCartao(faturas: FaturaCartaoDTO[]) {
  const groups = new Map<string, { key: string; nome: string; faturas: FaturaCartaoDTO[] }>()

  for (const fatura of faturas) {
    const key = fatura.contaId
    const current = groups.get(key) ?? {
      key,
      nome: fatura.conta?.nome ?? 'Cartao',
      faturas: [],
    }
    current.faturas.push(fatura)
    groups.set(key, current)
  }

  return Array.from(groups.values())
}
