'use client'

import { formatBRL } from '@/lib/money'
import type { ContaDTO } from '../types'

interface ContasKpiBarProps {
  contas: ContaDTO[]
}

export function ContasKpiBar({ contas }: ContasKpiBarProps) {
  const ativas = contas.filter(c => c.ativa)

  const patrimonioTotal = ativas
    .filter(c => c.tipo !== 'credit')
    .reduce((acc, c) => acc + c.saldoAtualCentavos, 0)

  const operacional = ativas
    .filter(c => ['checking', 'savings', 'wallet', 'custom'].includes(c.tipo))
    .reduce((acc, c) => acc + c.saldoAtualCentavos, 0)

  const investimentos = ativas
    .filter(c => c.tipo === 'investment')
    .reduce((acc, c) => acc + c.saldoAtualCentavos, 0)

  const cartoesAtivos = ativas.filter(c => c.tipo === 'credit').length

  const items = [
    {
      label: 'Saldo Total',
      value: formatBRL(patrimonioTotal),
      positive: patrimonioTotal >= 0,
      accent: 'blue',
    },
    {
      label: 'Operacional',
      value: formatBRL(operacional),
      positive: operacional >= 0,
      accent: 'green',
    },
    {
      label: 'Investimentos',
      value: formatBRL(investimentos),
      positive: true,
      accent: 'purple',
    },
    {
      label: 'Cartões Ativos',
      value: String(cartoesAtivos),
      positive: true,
      accent: 'pink',
      isCount: true,
    },
  ]

  const accentMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    blue:   { bg: 'bg-blue-500/10 dark:bg-blue-500/[0.08]',   border: 'border-blue-500/20',  text: 'text-blue-600 dark:text-blue-400',   dot: 'bg-blue-500' },
    green:  { bg: 'bg-green-500/10 dark:bg-green-500/[0.08]', border: 'border-green-500/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    purple: { bg: 'bg-violet-500/10 dark:bg-violet-500/[0.08]', border: 'border-violet-500/20', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
    pink:   { bg: 'bg-pink-500/10 dark:bg-pink-500/[0.08]',   border: 'border-pink-500/20',  text: 'text-pink-600 dark:text-pink-400',   dot: 'bg-pink-500' },
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(item => {
        const a = accentMap[item.accent]
        return (
          <div
            key={item.label}
            className={`relative rounded-2xl border ${a.border} ${a.bg} px-4 py-3.5`}
          >
            <div className={`absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full ${a.dot}`} />
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className={`text-lg font-bold tabular-nums ${item.isCount ? a.text : item.positive ? 'text-gray-900 dark:text-gray-100' : 'text-red-500 dark:text-red-400'}`}>
              {item.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
