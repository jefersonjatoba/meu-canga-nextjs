'use client'

import { Pencil, PowerOff, Landmark } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { TIPO_CONTA_LABELS, type ContaDTO } from '../types'

interface ContaItemProps {
  conta: ContaDTO
  onEdit: (conta: ContaDTO) => void
  onDesativar: (conta: ContaDTO) => void
}

const TIPO_ICONS: Record<string, string> = {
  checking:   '🏦',
  savings:    '🐷',
  credit:     '💳',
  investment: '📈',
  wallet:     '👛',
  custom:     '🏧',
}

export function ContaItem({ conta, onEdit, onDesativar }: ContaItemProps) {
  const saldo = formatBRL(conta.saldoCentavos)
  const positivo = conta.saldoCentavos >= 0
  const icone = TIPO_ICONS[conta.tipo] ?? '🏦'
  const cor = conta.cor ?? '#3b82f6'

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
      {/* Ícone colorido */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{ backgroundColor: `${cor}20`, border: `1.5px solid ${cor}40` }}
        aria-hidden
      >
        {icone}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{conta.nome}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {TIPO_CONTA_LABELS[conta.tipo]}
          {conta.banco ? ` · ${conta.banco}` : ''}
        </p>
      </div>

      {/* Saldo */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${positivo ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {saldo}
        </p>
        <p className="text-xs text-gray-400">saldo atual</p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={() => onEdit(conta)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          aria-label={`Editar ${conta.nome}`}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDesativar(conta)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          aria-label={`Desativar ${conta.nome}`}
        >
          <PowerOff size={14} />
        </button>
      </div>
    </div>
  )
}
