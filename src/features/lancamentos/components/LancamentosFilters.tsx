'use client'

import { ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react'
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
  contaFiltro?: string | null
  onClearContaFiltro?: () => void
}

export function LancamentosFilters({
  mes,
  tipo,
  onMesChange,
  onTipoChange,
  contaFiltro,
  onClearContaFiltro,
}: LancamentosFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Month navigator */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08] rounded-lg p-1">
          <button
            onClick={() => onMesChange(addMonths(mes, -1))}
            aria-label="Mês anterior"
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <span className="px-3 text-sm font-medium text-gray-700 dark:text-gray-200 min-w-[130px] text-center">
            {formatMesLabel(mes)}
          </span>
          <button
            onClick={() => onMesChange(addMonths(mes, 1))}
            aria-label="Próximo mês"
            className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>

        {/* Tipo filter */}
        <div className="flex rounded-lg border border-gray-200 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#1C1C1C]">
          {TIPO_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onTipoChange(opt.value)}
              className={cn(
                'px-3.5 py-2 text-sm font-medium transition-colors',
                opt.value !== TIPO_OPTIONS[TIPO_OPTIONS.length - 1].value &&
                  'border-r border-gray-200 dark:border-white/[0.08]',
                tipo === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge de conta ativa */}
      {contaFiltro && (
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
            <Building2 size={11} />
            <span>Conta: {contaFiltro}</span>
            {onClearContaFiltro && (
              <button
                type="button"
                onClick={onClearContaFiltro}
                className="ml-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-500/20 p-0.5 transition-colors"
                aria-label="Limpar filtro de conta"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">Mostrando apenas movimentações desta conta</span>
        </div>
      )}
    </div>
  )
}
