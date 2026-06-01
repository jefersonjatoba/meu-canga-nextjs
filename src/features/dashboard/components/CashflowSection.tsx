'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { formatBRL } from '@/lib/money'

interface CashflowSectionProps {
  saldoOperacionalCentavos: number
  totalReceitasCentavos: number
  totalDespesasCentavos: number
  totalRasCentavos: number
  patrimonioInvestidoCentavos: number
  taxaPoupancaPercentual: number
}

export function CashflowSection({
  saldoOperacionalCentavos,
  totalReceitasCentavos,
  totalDespesasCentavos,
  totalRasCentavos,
  patrimonioInvestidoCentavos,
  taxaPoupancaPercentual,
}: CashflowSectionProps) {
  const chartData = [
    { name: 'Receitas', valor: Math.round(totalReceitasCentavos / 100) },
    { name: 'Despesas', valor: Math.round(totalDespesasCentavos / 100) },
    { name: 'RAS', valor: Math.round(totalRasCentavos / 100) },
  ]

  const getSavingsTone = (rate: number) => {
    if (rate >= 20) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        text: 'text-emerald-700 dark:text-emerald-400',
        progressBg: 'bg-emerald-500',
      }
    }
    if (rate >= 10) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        text: 'text-orange-700 dark:text-orange-400',
        progressBg: 'bg-orange-500',
      }
    }
    return {
      bg: 'bg-red-50 dark:bg-red-500/10',
      text: 'text-red-700 dark:text-red-400',
      progressBg: 'bg-red-500',
    }
  }

  const savingsTone = getSavingsTone(taxaPoupancaPercentual)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Fluxo de caixa</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Saldo operacional:{' '}
            <span
              className={`font-medium ${saldoOperacionalCentavos >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatBRL(saldoOperacionalCentavos)}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-white/[0.08]"
            />
            <XAxis dataKey="name" stroke="currentColor" className="text-xs text-gray-500 dark:text-gray-400" />
            <YAxis stroke="currentColor" className="text-xs text-gray-500 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-dark-card)',
                border: '1px solid var(--color-dark-border)',
                borderRadius: '8px',
                color: 'var(--color-dark-text)',
              }}
              formatter={(value: unknown) => formatBRL(((value as number) ?? 0) * 100)}
              labelStyle={{ color: 'var(--color-dark-text)' }}
            />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <TrendingUp size={12} aria-hidden />
              Receitas
            </p>
            <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
              {formatBRL(totalReceitasCentavos)}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
              <TrendingDown size={12} aria-hidden />
              Despesas
            </p>
            <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-300">
              {formatBRL(totalDespesasCentavos)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              <PiggyBank size={12} aria-hidden />
              RAS
            </p>
            <p className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-300">
              {formatBRL(totalRasCentavos)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`rounded-xl border border-gray-200 p-5 shadow-sm dark:border-white/[0.08] ${savingsTone.bg}`}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className={`mb-1 text-xs font-medium ${savingsTone.text}`}>Taxa de poupança</p>
              <p className={`text-2xl font-bold tabular-nums ${savingsTone.text}`}>
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
              <span className={`text-xs font-bold ${savingsTone.text}`}>
                {Math.min(taxaPoupancaPercentual, 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${savingsTone.progressBg}`}
                style={{ width: `${Math.min(taxaPoupancaPercentual, 100)}%` }}
                aria-hidden
              />
            </div>
            <p className={`mt-2 text-[11px] opacity-75 ${savingsTone.text}`}>
              {taxaPoupancaPercentual >= 20
                ? 'Acima da meta recomendada'
                : taxaPoupancaPercentual >= 10
                  ? 'Em observação — ainda cabe evoluir'
                  : 'Abaixo do recomendado neste momento'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
          <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Patrimônio investido</p>
          <p className="mb-4 text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">
            {formatBRL(patrimonioInvestidoCentavos)}
          </p>

          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <p>Total histórico acumulado de aportes menos resgates.</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Resultado líquido: {patrimonioInvestidoCentavos > 0 ? '+' : ''}
              {formatBRL(patrimonioInvestidoCentavos)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
