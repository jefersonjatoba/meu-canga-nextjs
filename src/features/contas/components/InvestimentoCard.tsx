'use client'

import Link from 'next/link'
import { Pencil, PowerOff, TrendingUp, ShieldCheck, AlertTriangle, Zap, Trash2, ExternalLink } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import {
  getInvestmentByLabel,
  getCategoryConfig,
  getRiskLabel,
  getRiskColor,
} from '@/lib/investment-config'
import type { ContaDTO } from '../types'

interface InvestimentoCardProps {
  conta: ContaDTO
  onEdit: (conta: ContaDTO) => void
  onDesativar: (conta: ContaDTO) => void
  onExcluir: (conta: ContaDTO) => void
}

function RiskIcon({ risk }: { risk: 'baixo' | 'medio' | 'alto' }) {
  if (risk === 'baixo') return <ShieldCheck size={10} />
  if (risk === 'medio') return <AlertTriangle size={10} />
  return <Zap size={10} />
}

export function InvestimentoCard({ conta, onEdit, onDesativar, onExcluir }: InvestimentoCardProps) {
  const investType = getInvestmentByLabel(conta.banco ?? '')
  const category   = investType?.category ?? 'renda_fixa'
  const catCfg     = getCategoryConfig(category)
  const risk       = investType?.risk ?? 'medio'
  const riskColor  = getRiskColor(risk)
  const riskLabel  = getRiskLabel(risk)
  const typeLabel  = investType?.label ?? (conta.banco ?? 'Investimento')
  const typeDesc   = investType?.description ?? ''
  const abbr       = investType?.abbr ?? typeLabel.slice(0, 4).toUpperCase()

  // Saldo configurado = saldo inicial definido pelo usuário ao criar a conta.
  // NÃO representa valor de mercado — posição real está no módulo Investimentos.
  const saldoConfigurado = conta.saldoAtualCentavos

  return (
    <div className="group h-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#161616] hover:border-gray-300 dark:hover:border-white/[0.14] transition-colors flex flex-col overflow-hidden">

      {/* Category accent top bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: catCfg.color }} />

      {/* Header */}
      <div className="px-3.5 pt-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {/* Type badge */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black tracking-tight"
              style={{ backgroundColor: `${catCfg.color}18`, border: `1.5px solid ${catCfg.color}35`, color: catCfg.color }}
            >
              {abbr.length > 4 ? abbr.slice(0, 4) : abbr}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{conta.nome}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{typeDesc || typeLabel}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button type="button" onClick={() => onEdit(conta)} className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Editar"><Pencil size={12} /></button>
            <button type="button" onClick={() => onDesativar(conta)} className="p-1 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors" title="Desativar"><PowerOff size={12} /></button>
            <button type="button" onClick={() => onExcluir(conta)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Excluir permanentemente"><Trash2 size={12} /></button>
          </div>
        </div>

        {/* Category + Risk tags */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${catCfg.bgClass} ${catCfg.darkBgClass} ${catCfg.textClass} ${catCfg.darkTextClass}`}
            style={{ borderColor: `${catCfg.color}30` }}
          >
            {catCfg.label}
          </span>
          <span
            className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${riskColor}12`,
              color: riskColor,
              borderColor: `${riskColor}25`,
            }}
          >
            <RiskIcon risk={risk} />
            {riskLabel}
          </span>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3.5" />

      {/* Saldo configurado */}
      <div className="px-3.5 py-2.5">
        <p className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
          Saldo configurado
        </p>
        <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {formatBRL(saldoConfigurado)}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
          Valor inicial definido ao criar a conta
        </p>
      </div>

      <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3.5" />

      {/* Callout para o módulo real */}
      <div className="px-3.5 py-2.5 flex items-start gap-2">
        <ExternalLink size={13} className="text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-snug">
            Posição, rentabilidade e operações são acompanhados no módulo{' '}
            <Link
              href="/dashboard/investimentos"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Investimentos
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-auto h-px bg-gray-100 dark:bg-white/[0.05]" />
      <Link
        href="/dashboard/investimentos"
        className="flex items-center justify-center gap-1 py-2 text-[11px] font-medium text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
      >
        <TrendingUp size={11} />
        Ver carteira de investimentos
      </Link>
    </div>
  )
}
