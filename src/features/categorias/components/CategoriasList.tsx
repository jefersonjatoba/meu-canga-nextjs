'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import { CategoriaItem } from './CategoriaItem'
import { CategoriasEmptyState } from './CategoriasEmptyState'
import type { CategoriaDTO } from '../types'

interface CategoriasListProps {
  categorias: CategoriaDTO[]
  loading: boolean
  error: string | null
  onEdit: (categoria: CategoriaDTO) => void
  onDesativar: (categoria: CategoriaDTO) => void
  onNova: () => void
}

export function CategoriasList({
  categorias,
  loading,
  error,
  onEdit,
  onDesativar,
  onNova,
}: CategoriasListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
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

  if (categorias.length === 0) {
    return <CategoriasEmptyState onNova={onNova} />
  }

  return (
    <div className="space-y-3">
      {categorias.map((categoria) => (
        <CategoriaItem
          key={categoria.id}
          categoria={categoria}
          onEdit={onEdit}
          onDesativar={onDesativar}
        />
      ))}
    </div>
  )
}
