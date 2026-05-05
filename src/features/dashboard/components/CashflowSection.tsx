'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell } from 'recharts'
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'
import { formatBRL } from '@/lib/money'

interface CashflowSectionProps {
  totalReceitasCentavos: number
  totalDespesasCentavos: number
  totalRasCentavos: number
  patrimonioInvestidoCentavos: number
  taxaPoupancaPercentual: number
}

export function CashflowSection({
  totalReceitasCentavos,
  totalDespesasCentavos,
  totalRasCentavos,
  patrimonioInvestidoCentavos,
  taxaPoupancaPercentual,
}: CashflowSectionProps) {
  // Preparar dados para o gráfico de receita vs despesa
  const chartData = [
    {
      name: 'Receitas',
      valor: Math.round(totalReceitasCentavos / 100),
    },
    {
      name: 'Despesas',
      valor: Math.round(totalDespesasCentavos / 100),
    },
    {
      name: 'RAS',
      valor: Math.round(totalRasCentavos / 100),
    },
  ]

  // Determinar cor da taxa de poupança
  const getSavingsTone = (rate: number) => {
    if (rate >= 20) return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', progressBg: 'bg-emerald-500' }
    if (rate >= 10) return { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', progressBg: 'bg-orange-500' }
    return { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400', progressBg: 'bg-red-500' }
  }

  const savingsTone = getSavingsTone(taxaPoupancaPercentual)

  return (
    <div className="space-y-4">
      {/* Card Receitas vs Despesas */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Fluxo de Caixa</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Saldo: <span className="font-medium text-gray-700 dark:text-gray-300">{formatBRL(totalReceitasCentavos - totalDespesasCentavos)}</span>
          </div>
        </div>

        {/* Gráfico de barras */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-white/[0.08]" />
            <XAxis dataKey="name" stroke="currentColor" className="text-xs text-gray-500 dark:text-gray-400" />
            <YAxis stroke="currentColor" className="text-xs text-gray-500 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-dark-card)',
                border: '1px solid var(--color-dark-border)',
                borderRadius: '8px',
                color: 'var(--color-dark-text)',
              }}
              formatter={(value: any) => formatBRL((value ?? 0) * 100)}
              labelStyle={{ color: 'var(--color-dark-text)' }}
            />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Totais em cards */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <TrendingUp size={12} aria-hidden />
              Receitas
            </p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300 tabular-nums">{formatBRL(totalReceitasCentavos)}</p>
          </div>

          <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
              <TrendingDown size={12} aria-hidden />
              Despesas
            </p>
            <p className="text-sm font-bold text-red-600 dark:text-red-300 tabular-nums">{formatBRL(totalDespesasCentavos)}</p>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
              <PiggyBank size={12} aria-hidden />
              RAS
            </p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-300 tabular-nums">{formatBRL(totalRasCentavos)}</p>
          </div>
        </div>
      </div>

      {/* Cards Taxa de Poupança + Patrimônio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Taxa de Poupança */}
        <div className={`rounded-xl border border-gray-200 dark:border-white/[0.08] ${savingsTone.bg} shadow-sm p-5`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className={`text-xs font-medium ${savingsTone.text} mb-1`}>Taxa de Poupança</p>
              <p className={`text-2xl font-bold ${savingsTone.text} tabular-nums`}>
                {taxaPoupancaPercentual.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-medium ${savingsTone.text} opacity-75`}>Meta</p>
              <p className={`text-lg font-bold ${savingsTone.text}`}>20%</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${savingsTone.text}`}>Progresso</span>
              <span className={`text-xs font-bold ${savingsTone.text}`}>{Math.min(taxaPoupancaPercentual, 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
              <div
                className={`h-full ${savingsTone.progressBg} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(taxaPoupancaPercentual, 100)}%` }}
                aria-hidden
              />
            </div>
            <p className={`text-[11px] ${savingsTone.text} opacity-75 mt-2`}>
              {taxaPoupancaPercentual >= 20
                ? '✓ Acima da meta recomendada'
                : taxaPoupancaPercentual >= 10
                  ? 'Em alerta — falta para atingir meta'
                  : 'Abaixo do recomendado'}
            </p>
          </div>
        </div>

        {/* Patrimônio Investido */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Patrimônio Investido</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4 tabular-nums">
            {formatBRL(patrimonioInvestidoCentavos)}
          </p>

          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p>Aportes menos resgates acumulados no período.</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Crescimento: {patrimonioInvestidoCentavos > 0 ? '+' : ''}{formatBRL(patrimonioInvestidoCentavos)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
