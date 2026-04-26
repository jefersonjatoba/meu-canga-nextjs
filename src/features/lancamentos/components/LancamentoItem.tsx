'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { TIPO_LABELS } from '@/features/lancamentos/types'
import type { TipoLancamento } from '@/features/lancamentos/types'
import type { LancamentoAPIItem } from '../api'

type IconComp = React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

const tipoIcon: Record<TipoLancamento, IconComp> = {
  income:             ArrowDownLeft,
  expense:            ArrowUpRight,
  ras:                Shield,
  investment_aporte:  TrendingUp,
  investment_resgate: TrendingDown,
  transfer:           ArrowLeftRight,
}

const tipoIconStyle: Record<TipoLancamento, string> = {
  income:             'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  expense:            'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
  ras:                'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  investment_aporte:  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  investment_resgate: 'bg-purple-50 dark:bg-purple-900/20 text-purple-400 dark:text-purple-300',
  transfer:           'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
}

const tipoValueStyle: Record<TipoLancamento, string> = {
  income:             'text-green-600 dark:text-green-400',
  expense:            'text-red-500 dark:text-red-400',
  ras:                'text-blue-600 dark:text-blue-400',
  investment_aporte:  'text-purple-600 dark:text-purple-400',
  investment_resgate: 'text-purple-400 dark:text-purple-300',
  transfer:           'text-gray-500 dark:text-gray-400',
}

const tipoSign: Record<TipoLancamento, string> = {
  income:             '+',
  expense:            '−',
  ras:                '+',
  investment_aporte:  '−',
  investment_resgate: '+',
  transfer:           '',
}

interface LancamentoItemProps {
  item: LancamentoAPIItem
  onEdit: (item: LancamentoAPIItem) => void
  onDelete: (item: LancamentoAPIItem) => void
  isLast?: boolean
}

function formatItemDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return dateStr
  }
}

export function LancamentoItem({ item, onEdit, onDelete, isLast = false }: LancamentoItemProps) {
  const Icon = tipoIcon[item.tipo] ?? ArrowLeftRight

  return (
    <li
      className={cn(
        'flex items-center gap-3 px-5 py-4 group',
        !isLast && 'border-b border-gray-100 dark:border-gray-700/40',
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          tipoIconStyle[item.tipo] ?? tipoIconStyle.transfer,
        )}
      >
        <Icon size={16} aria-hidden />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
            {item.descricao}
          </p>
          {item.status === 'pendente' && (
            <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium shrink-0">
              Pendente
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatItemDate(item.data)}
          </span>
          <span className="text-xs text-gray-200 dark:text-gray-700" aria-hidden>·</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {TIPO_LABELS[item.tipo] ?? item.tipo}
          </span>
          {item.categoria && (
            <>
              <span className="text-xs text-gray-200 dark:text-gray-700" aria-hidden>·</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{item.categoria}</span>
            </>
          )}
        </div>
      </div>

      {/* Value */}
      <span
        className={cn(
          'text-sm font-semibold tabular-nums shrink-0',
          tipoValueStyle[item.tipo] ?? 'text-gray-700 dark:text-gray-200',
        )}
      >
        {tipoSign[item.tipo] ?? ''}{formatBRL(item.valorCentavos)}
      </span>

      {/* Actions — visible on hover/focus */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          aria-label="Editar lançamento"
          className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Pencil size={14} aria-hidden />
        </button>
        <button
          onClick={() => onDelete(item)}
          aria-label="Excluir lançamento"
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={14} aria-hidden />
        </button>
      </div>
    </li>
  )
}
