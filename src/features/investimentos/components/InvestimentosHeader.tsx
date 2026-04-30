'use client'

import { Plus, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/money'

interface InvestimentosHeaderProps {
  totalAtivos: number
  patrimonioCentavos: number
  resultadoCentavos: number
  onNovoAtivo: () => void
}

export function InvestimentosHeader({
  totalAtivos,
  patrimonioCentavos,
  resultadoCentavos,
  onNovoAtivo,
}: InvestimentosHeaderProps) {
  const resultadoClass = resultadoCentavos >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#111111]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Investimentos
            </h1>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
              MVP
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Acompanhe ativos, operacoes e posicao sem movimentar automaticamente seu saldo financeiro.
          </p>
        </div>

        <Button type="button" onClick={onNovoAtivo}>
          <Plus size={16} aria-hidden />
          Adicionar ativo
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Ativos" value={String(totalAtivos)} />
        <Metric label="Valor atual manual" value={formatBRL(patrimonioCentavos)} />
        <Metric label="Resultado" value={formatBRL(resultadoCentavos)} valueClassName={resultadoClass} />
      </div>

      <div className="mt-4 flex gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#151515]">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Investimentos nao alteram automaticamente seu saldo financeiro.
        </p>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  valueClassName = 'text-gray-900 dark:text-gray-100',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#151515]">
      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}
