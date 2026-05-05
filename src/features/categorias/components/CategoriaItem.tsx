'use client'

import { Pencil, PowerOff, Tag } from 'lucide-react'
import { TIPO_CATEGORIA_LABELS, type CategoriaDTO } from '../types'

interface CategoriaItemProps {
  categoria: CategoriaDTO
  onEdit: (categoria: CategoriaDTO) => void
  onDesativar: (categoria: CategoriaDTO) => void
}

export function CategoriaItem({ categoria, onEdit, onDesativar }: CategoriaItemProps) {
  const cor = categoria.cor ?? '#3b82f6'

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#1A1A1A] dark:hover:border-gray-600">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
        style={{ backgroundColor: `${cor}20`, border: `1.5px solid ${cor}40`, color: cor }}
        aria-hidden
      >
        {categoria.icone ? <span>{categoria.icone}</span> : <Tag size={17} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {categoria.nome}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {TIPO_CATEGORIA_LABELS[categoria.tipo]} · Ordem {categoria.ordem}
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span
          className="h-3 w-3 rounded-full border border-black/5 dark:border-white/10"
          style={{ backgroundColor: cor }}
          aria-label={`Cor ${cor}`}
        />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {categoria.ativa ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(categoria)}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
          aria-label={`Editar ${categoria.nome}`}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDesativar(categoria)}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
          aria-label={`Desativar ${categoria.nome}`}
        >
          <PowerOff size={14} />
        </button>
      </div>
    </div>
  )
}
