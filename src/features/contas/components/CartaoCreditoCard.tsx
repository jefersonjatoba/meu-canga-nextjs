'use client'

import Link from 'next/link'
import { Pencil, PowerOff, Calendar, Trash2 } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { cardGradientStyle } from '@/lib/bank-config'
import { getCurrentCycle } from '@/lib/billing-cycle'
import type { ContaDTO } from '../types'

interface CartaoCreditoCardProps {
  conta: ContaDTO
  onEdit: (conta: ContaDTO) => void
  onDesativar: (conta: ContaDTO) => void
  onExcluir: (conta: ContaDTO) => void
}

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

function faturaStatus(percent: number) {
  if (percent === 0) return { label: 'Zerado', cls: 'bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500/20' }
  if (percent < 30)  return { label: 'Bom',    cls: 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' }
  if (percent < 70)  return { label: 'Atenção', cls: 'bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20' }
  return { label: 'Alto', cls: 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' }
}

function ChipIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" className="opacity-50">
      <rect x="0" y="0" width="4.5" height="4.5" rx="1" fill="currentColor"/>
      <rect x="6.75" y="0" width="4.5" height="4.5" rx="1" fill="currentColor"/>
      <rect x="13.5" y="0" width="4.5" height="4.5" rx="1" fill="currentColor"/>
      <rect x="0" y="6.5" width="4.5" height="4.5" rx="1" fill="currentColor"/>
      <rect x="6.75" y="6.5" width="4.5" height="4.5" rx="1" fill="currentColor"/>
      <rect x="13.5" y="6.5" width="4.5" height="4.5" rx="1" fill="currentColor"/>
    </svg>
  )
}

export function CartaoCreditoCard({ conta, onEdit, onDesativar, onExcluir }: CartaoCreditoCardProps) {
  const gradient = cardGradientStyle(conta.cor)

  // Data hoje em São Paulo (cliente)
  const today    = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const cycle    = conta.diaFechamento && conta.diaVencimento
    ? getCurrentCycle(conta.diaFechamento, conta.diaVencimento, today)
    : null

  // Fatura do ciclo atual: vem do campo faturaAtualCentavos (FaturaCartao.totalCentavos)
  const fatura    = conta.faturaAtualCentavos ?? 0
  const limite    = conta.limiteCentavos ?? 0
  const disponivel = conta.limiteDisponivelCentavos ?? Math.max(0, limite - fatura)
  const percent   = limite > 0 ? Math.min((fatura / limite) * 100, 100) : 0
  const status    = faturaStatus(Math.round(percent))

  // Label do ciclo: "Maio 2026" derivado do fechamento; fallback para mês atual
  const cicloLabel = cycle
    ? cycle.label
    : `${MESES[new Date().getMonth()]}/${new Date().getFullYear()}`

  // Mês/ano de vencimento da fatura atual
  const vencLabel = cycle
    ? `${MESES[parseInt(cycle.vencimento.slice(5, 7)) - 1]}/${cycle.vencimento.slice(0, 4)}`
    : ''

  return (
    <div className="group h-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] transition-colors flex flex-col">

      {/* Gradient header */}
      <div className="relative px-3 py-2 overflow-hidden" style={{ background: gradient }}>
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/[0.07] pointer-events-none" />
        <div className="absolute -bottom-6 right-1 w-12 h-12 rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button type="button" onClick={() => onEdit(conta)} className="p-1 rounded text-white/50 hover:text-white hover:bg-white/15 transition-colors" title="Editar"><Pencil size={10} /></button>
          <button type="button" onClick={() => onDesativar(conta)} className="p-1 rounded text-white/50 hover:text-orange-300 hover:bg-orange-500/15 transition-colors" title="Desativar"><PowerOff size={10} /></button>
          <button type="button" onClick={() => onExcluir(conta)} className="p-1 rounded text-white/50 hover:text-red-300 hover:bg-red-500/15 transition-colors" title="Excluir permanentemente"><Trash2 size={10} /></button>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="text-white opacity-60"><ChipIcon /></div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{conta.nome}</p>
            <p className="text-[9px] text-white/50 tracking-widest">CARTÃO DE CRÉDITO</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-[#161616] flex flex-col flex-1">

        {/* Fatura */}
        <div className="px-3 pt-2 pb-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fatura {cicloLabel}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatBRL(fatura)}</p>
        </div>

        <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3" />

        {/* Limite / Disponível / % Usado */}
        <div className="grid grid-cols-3 px-3 py-1.5 gap-x-1 gap-y-0">
          <div className="min-w-0">
            <p className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Limite</p>
            <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 tabular-nums truncate">{formatBRL(limite)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Disponível</p>
            <p className="text-[10px] font-semibold text-green-500 dark:text-green-400 tabular-nums truncate">{formatBRL(disponivel)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">% Usado</p>
            <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{Math.round(percent)}%</p>
          </div>
        </div>

        {limite > 0 && (
          <div className="px-3 pb-1.5">
            <div className="h-1 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: percent > 70 ? '#ef4444' : percent > 30 ? '#f59e0b' : '#22c55e' }} />
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3" />

        {/* Datas do ciclo */}
        <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500">
          {conta.diaFechamento && (
            <span className="flex items-center gap-1">
              <Calendar size={9} />Fecha dia {conta.diaFechamento}
            </span>
          )}
          {vencLabel ? (
            <span className="flex items-center gap-1 ml-auto text-blue-500 dark:text-blue-400 font-medium">
              <Calendar size={9} />Pagar dia {conta.diaVencimento} · {vencLabel}
            </span>
          ) : conta.diaVencimento ? (
            <span className="flex items-center gap-1">
              <Calendar size={9} />Vence dia {conta.diaVencimento}
            </span>
          ) : null}
        </div>

        <div className="mt-auto h-px bg-gray-100 dark:bg-white/[0.05]" />
        <Link href={`/dashboard/fatura/${conta.id}`} className="flex items-center justify-center py-1.5 text-[11px] font-medium text-gray-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
          Ver fatura →
        </Link>
      </div>
    </div>
  )
}
