'use client'

import { Plus, Tags } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CategoriasEmptyStateProps {
  onNova: () => void
}

export function CategoriasEmptyState({ onNova }: CategoriasEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30">
        <Tags size={28} className="text-blue-500" aria-hidden />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Nenhuma categoria cadastrada
      </h3>
      <p className="mb-6 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Crie categorias para classificar lancamentos com mais consistencia.
      </p>
      <Button variant="primary" onClick={onNova}>
        <Plus size={16} className="mr-1.5" aria-hidden />
        Criar categoria
      </Button>
    </div>
  )
}
