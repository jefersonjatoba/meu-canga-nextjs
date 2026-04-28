'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TipoCategoria } from '../types'

interface CategoriasHeaderProps {
  totalCategorias: number
  tipo: TipoCategoria | 'all'
  onTipoChange: (tipo: TipoCategoria | 'all') => void
  onNova: () => void
}

const filtros: Array<{ value: TipoCategoria | 'all'; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'both', label: 'Ambos' },
]

export function CategoriasHeader({
  totalCategorias,
  tipo,
  onTipoChange,
  onNova,
}: CategoriasHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categorias</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {totalCategorias === 0
            ? 'Nenhuma categoria cadastrada'
            : `${totalCategorias} categoria${totalCategorias !== 1 ? 's' : ''} ativa${totalCategorias !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-[#1A1A1A]">
          {filtros.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onTipoChange(item.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tipo === item.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Button variant="primary" onClick={onNova}>
          <Plus size={16} className="mr-1.5" aria-hidden />
          Nova categoria
        </Button>
      </div>
    </div>
  )
}
