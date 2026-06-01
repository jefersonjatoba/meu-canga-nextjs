'use client'

import { Plus, TrendingDown, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/money'

interface InvestimentosHeaderProps {
  totalAtivos:          number
  custoTotalCentavos:   number
  patrimonioCentavos:   number
  resultadoCentavos:    number
  variacaoHojeCentavos: number
  cotacoesLoading:      boolean
  onNovoAtivo:          () => void
}

export function InvestimentosHeader({
  totalAtivos,
  custoTotalCentavos,
  patrimonioCentavos,
  resultadoCentavos,
  variacaoHojeCentavos,
  cotacoesLoading,
  onNovoAtivo,
}: InvestimentosHeaderProps) {
  const temDados        = patrimonioCentavos > 0
  const rentabilidade   = custoTotalCentavos > 0 ? (resultadoCentavos / custoTotalCentavos) * 100 : null

  const resultadoPositivo = resultadoCentavos >= 0
  const variacaoPositiva  = variacaoHojeCentavos >= 0

  const resultadoClass = resultadoPositivo
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400'

  const variacaoClass = variacaoPositiva
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.06] dark:bg-[#1A1A1A]">
      {/* ── Título + botão ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Carteira de Investimentos
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {totalAtivos} {totalAtivos === 1 ? 'ativo' : 'ativos'} cadastrado{totalAtivos === 1 ? '' : 's'}
          </p>
        </div>
        <Button type="button" onClick={onNovoAtivo}>
          <Plus size={16} aria-hidden />
          Adicionar ativo
        </Button>
      </div>

      {/* ── Bloco principal: Valor atual em destaque ── */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Valor atual da carteira
        </p>
        <div className="mt-1 flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {cotacoesLoading && !temDados ? (
              <span className="inline-block h-8 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-white/[0.08]" />
            ) : (
              formatBRL(patrimonioCentavos)
            )}
          </span>

          {/* Variação de hoje */}
          {temDados && !cotacoesLoading && (
            <span className={`mb-1 flex items-center gap-1 text-sm font-semibold ${variacaoClass}`}>
              {variacaoPositiva
                ? <TrendingUp size={15} aria-hidden />
                : <TrendingDown size={15} aria-hidden />}
              {variacaoPositiva ? '+' : ''}{formatBRL(variacaoHojeCentavos)} hoje
            </span>
          )}
        </div>
      </div>

      {/* ── Grid de métricas secundárias ── */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Total investido"
          value={formatBRL(custoTotalCentavos)}
        />
        <Metric
          label="Resultado total"
          value={
            temDados
              ? `${resultadoPositivo ? '+' : ''}${formatBRL(resultadoCentavos)}`
              : '—'
          }
          valueClassName={temDados ? resultadoClass : undefined}
          loading={cotacoesLoading && !temDados}
        />
        <Metric
          label="Rentabilidade"
          value={
            rentabilidade != null && temDados
              ? `${rentabilidade >= 0 ? '+' : ''}${rentabilidade.toFixed(2)}%`
              : '—'
          }
          valueClassName={
            rentabilidade != null && temDados
              ? (rentabilidade >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')
              : undefined
          }
          loading={cotacoesLoading && !temDados}
        />
        <Metric
          label="Variação hoje"
          value={
            temDados
              ? `${variacaoPositiva ? '+' : ''}${formatBRL(variacaoHojeCentavos)}`
              : '—'
          }
          valueClassName={temDados ? variacaoClass : undefined}
          loading={cotacoesLoading && !temDados}
        />
      </div>

      {/* ── Aviso sobre saldo ── */}
      <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-600">
        Cotações com delay de até 20 min via Yahoo Finance · Investimentos não alteram o saldo operacional automaticamente
      </p>
    </div>
  )
}

function Metric({
  label,
  value,
  valueClassName = 'text-gray-900 dark:text-gray-100',
  loading,
}: {
  label:           string
  value:           string
  valueClassName?: string
  loading?:        boolean
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-white/[0.06] dark:bg-[#151515]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      {loading ? (
        <div className="mt-1.5 h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-white/[0.08]" />
      ) : (
        <p className={`mt-1 text-sm font-bold ${valueClassName}`}>{value}</p>
      )}
    </div>
  )
}
