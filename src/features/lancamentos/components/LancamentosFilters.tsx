'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function addMonths(mes: string, delta: number): string {
  const [year, month] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, 1))
  return d
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

const TIPO_OPTIONS = [
  { value: 'all',     label: 'Todos' },
  { value: 'income',  label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
] as const

type TipoFilter = 'all' | 'income' | 'expense'

interface LancamentosFiltersProps {
  mes: string
  tipo: TipoFilter
  onMesChange: (mes: string) => void
  onTipoChange: (tipo: TipoFilter) => void
}

export function LancamentosFilters({
  mes,
  tipo,
  onMesChange,
  onTipoChange,
}: LancamentosFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Month navigator */}
      <div className="flex items-center gap-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700/60 rounded-lg p-1">
        <button
          onClick={() => onMesChange(addMonths(mes, -1))}
          aria-label="Mês anterior"
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[130px] text-center">
          {formatMesLabel(mes)}
        </span>
        <button
          onClick={() => onMesChange(addMonths(mes, 1))}
          aria-label="Próximo mês"
          className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      {/* Tipo filter */}
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700/60 overflow-hidden bg-white dark:bg-[#1E1E1E]">
        {TIPO_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onTipoChange(opt.value)}
            className={cn(
              'px-3.5 py-2 text-sm font-medium transition-colors',
              opt.value !== TIPO_OPTIONS[TIPO_OPTIONS.length - 1].value &&
                'border-r border-gray-200 dark:border-gray-700/60',
              tipo === opt.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
