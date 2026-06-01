'use client'

import { Input } from '@/components/ui/Input'
import type { CategoriaDTO, TipoCategoria } from '@/features/categorias/types'
import { buildCategoryOptions, OUTROS_CATEGORIA } from '@/lib/categories'

export { OUTROS_CATEGORIA } from '@/lib/categories'

interface CategorySelectProps {
  categorias: CategoriaDTO[]
  tipo?: TipoCategoria
  categoriaId: string
  categoriaManual: string
  onCategoriaIdChange: (id: string) => void
  onCategoriaManualChange: (nome: string) => void
  label?: string
  required?: boolean
  errorManual?: string
  disabled?: boolean
}

export function CategorySelect({
  categorias,
  tipo,
  categoriaId,
  categoriaManual,
  onCategoriaIdChange,
  onCategoriaManualChange,
  label = 'Categoria',
  required,
  errorManual,
  disabled,
}: CategorySelectProps) {
  const options = buildCategoryOptions(categorias, tipo)
  const isOutros = categoriaId === OUTROS_CATEGORIA

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
        </span>
        <select
          value={categoriaId}
          disabled={disabled}
          onChange={e => onCategoriaIdChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
        >
          <option value="">Selecione uma categoria...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
          <option value={OUTROS_CATEGORIA}>Outros (digitar manualmente)</option>
        </select>
      </label>

      {isOutros && (
        <Input
          label="Qual categoria?"
          required
          placeholder="Ex: Streaming, Academia, Seguro…"
          value={categoriaManual}
          onChange={e => onCategoriaManualChange(e.target.value)}
          error={errorManual}
        />
      )}
    </div>
  )
}
