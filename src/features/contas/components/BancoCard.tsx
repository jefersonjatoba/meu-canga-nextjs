'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Pencil, PowerOff, Trash2 } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { getBankConfig, getBankInitials } from '@/lib/bank-config'
import type { ContaDTO } from '../types'

interface BancoCardProps {
  conta: ContaDTO
  onEdit: (conta: ContaDTO) => void
  onDesativar: (conta: ContaDTO) => void
  onExcluir: (conta: ContaDTO) => void
}

function StatusBadge({ saldo }: { saldo: number }) {
  if (saldo === 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-500/15 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-500/20">
      <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-400" />Zerado
    </span>
  )
  if (saldo > 0) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-500/15 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
      <span className="w-1 h-1 rounded-full bg-green-500" />Saudável
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
      <span className="w-1 h-1 rounded-full bg-red-500" />Negativo
    </span>
  )
}

export function BancoCard({ conta, onEdit, onDesativar, onExcluir }: BancoCardProps) {
  const bankCfg = getBankConfig(conta.banco ?? conta.nome)
  const tipoPt  = conta.tipo === 'savings' ? 'POUPANÇA' : conta.tipo === 'wallet' ? 'CARTEIRA' : 'BANCO'

  return (
    <div className="group h-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#161616] hover:border-gray-300 dark:hover:border-white/[0.14] transition-colors flex flex-col overflow-hidden">

      {/* Accent bar — cor do banco */}
      <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: bankCfg.color }} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${bankCfg.color}18`, border: `1.5px solid ${bankCfg.color}35` }}
          >
            {bankCfg.logo
              ? <Image src={bankCfg.logo} alt={bankCfg.label} width={18} height={18} className="object-contain p-0.5" />
              : <span className="text-[8px] font-bold" style={{ color: bankCfg.color }}>{getBankInitials(conta.banco ?? conta.nome)}</span>
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{conta.nome}</p>
            <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 tracking-widest">{tipoPt}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onEdit(conta)} className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Editar"><Pencil size={11} /></button>
          <button type="button" onClick={() => onDesativar(conta)} className="p-1 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Desativar"><PowerOff size={11} /></button>
          <button type="button" onClick={() => onExcluir(conta)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Excluir permanentemente"><Trash2 size={11} /></button>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3" />

      {/* Saldo */}
      <div className="px-3 py-1.5">
        <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Saldo</p>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-base font-bold tabular-nums ${conta.saldoAtualCentavos >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-500 dark:text-red-400'}`}>
            {formatBRL(conta.saldoAtualCentavos)}
          </p>
          <StatusBadge saldo={conta.saldoAtualCentavos} />
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3" />

      {/* Entradas / Saídas — mês atual */}
      <div className="grid grid-cols-2 px-3 py-1.5 gap-2">
        <div>
          <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Entradas<span className="normal-case font-normal ml-1 text-gray-300 dark:text-gray-600">mês</span></p>
          <p className="text-xs font-semibold text-green-500 dark:text-green-400 tabular-nums">+{formatBRL(conta.entradasCentavos)}</p>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Saídas<span className="normal-case font-normal ml-1 text-gray-300 dark:text-gray-600">mês</span></p>
          <p className="text-xs font-semibold text-red-500 dark:text-red-400 tabular-nums">-{formatBRL(conta.saidasCentavos)}</p>
        </div>
      </div>

      <div className="mt-auto h-px bg-gray-100 dark:bg-white/[0.05]" />
      <Link href={`/dashboard/lancamentos?contaId=${conta.id}`} className="flex items-center justify-center py-1.5 text-[11px] font-medium text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
        Ver movimentações →
      </Link>
    </div>
  )
}
