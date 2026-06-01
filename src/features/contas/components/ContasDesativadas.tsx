'use client'

import Image from 'next/image'
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { getBankConfig, getBankInitials } from '@/lib/bank-config'
import { TIPO_CONTA_LABELS } from '../types'
import type { ContaDTO } from '../types'

interface ContasDesativadasProps {
  contas: ContaDTO[]
  onReativar: (conta: ContaDTO) => void
  loading: boolean
  open: boolean
  onToggle: () => void
}

export function ContasDesativadas({ contas, onReativar, loading, open, onToggle }: ContasDesativadasProps) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Contas desativadas{contas.length > 0 ? ` (${contas.length})` : ''}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Carregando…</p>
          )}
          {!loading && contas.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Nenhuma conta desativada.</p>
          )}
          {!loading && contas.map(conta => {
            const bankCfg = getBankConfig(conta.banco ?? conta.nome)
            return (
              <div
                key={conta.id}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] opacity-60"
              >
                {/* Logo */}
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 p-0.5"
                  style={{ backgroundColor: `${bankCfg.color}15`, border: `1px solid ${bankCfg.color}25` }}
                >
                  {bankCfg.logo
                    ? <Image src={bankCfg.logo} alt={bankCfg.label} width={18} height={18} className="object-contain" />
                    : <span className="text-[8px] font-bold" style={{ color: bankCfg.color }}>{getBankInitials(conta.banco ?? conta.nome)}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">{conta.nome}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600">{TIPO_CONTA_LABELS[conta.tipo]} · {formatBRL(conta.saldoAtualCentavos)}</p>
                </div>

                {/* Reativar */}
                <button
                  type="button"
                  onClick={() => onReativar(conta)}
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors shrink-0 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10"
                >
                  <RotateCcw size={11} />
                  Reativar
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
