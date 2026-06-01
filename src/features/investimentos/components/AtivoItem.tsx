'use client'

import { Eye, Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/money'
import type { InvestimentoAtivoDetalheDTO } from '../types'
import type { CotacaoDTO } from '../hooks/useCotacoes'
import { temCotacao } from '../hooks/useCotacoes'

interface AtivoItemProps {
  ativo:                InvestimentoAtivoDetalheDTO
  cotacao:              CotacaoDTO | null
  cotacaoLoading:       boolean
  precoManualCentavos:  number | null
  portfolioPercent?:    number | null
  onPrecoManualChange:  (value: number | null) => void
  onDetalhe:            () => void
  onOperacao:           () => void
}

export function AtivoItem({
  ativo,
  cotacao,
  cotacaoLoading,
  precoManualCentavos,
  portfolioPercent,
  onPrecoManualChange,
  onDetalhe,
  onOperacao,
}: AtivoItemProps) {
  const quantidade  = Number(ativo.posicao.quantidadeAtual)
  const hasCotacao  = temCotacao(ativo.tipo)
  const semCotacao  = ['renda_fixa', 'fundo', 'outro'].includes(ativo.tipo)

  // Preço efetivo: override manual > cotação automática > nulo
  const precoEfetivoCentavos = precoManualCentavos ?? cotacao?.precoCentavos ?? null

  const valorAtualCentavos = precoEfetivoCentavos == null
    ? null
    : Math.round(quantidade * precoEfetivoCentavos)

  const resultadoCentavos = valorAtualCentavos == null
    ? null
    : valorAtualCentavos - ativo.posicao.custoTotalCentavos

  const rentabilidade = resultadoCentavos == null || ativo.posicao.custoTotalCentavos <= 0
    ? null
    : (resultadoCentavos / ativo.posicao.custoTotalCentavos) * 100

  // Variação diária em R$
  const variacaoDiaCentavos = valorAtualCentavos != null && cotacao?.variacaoPercent != null
    ? Math.round(valorAtualCentavos * cotacao.variacaoPercent / 100)
    : null

  const resultadoPositivo = resultadoCentavos != null && resultadoCentavos >= 0
  const variacaoPositiva  = cotacao?.variacaoPercent != null && cotacao.variacaoPercent >= 0

  const resultadoClass = resultadoPositivo
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400'

  const variacaoClass = variacaoPositiva
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400'

  // Tempo desde última atualização da cotação
  const ultimaAtualizacao = cotacao?.atualizadoEm
    ? formatRelativeTime(new Date(cotacao.atualizadoEm))
    : null

  return (
    <article className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#1A1A1A]">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ativo.nome}</h3>
            <Badge variant="outline" size="sm">{ativo.ticker}</Badge>
            {!ativo.ativo && (
              <Badge variant="default" size="sm">inativo</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {ativo.tipo.replace('_', ' ')} · {ativo.moeda}{ativo.corretora ? ` · ${ativo.corretora}` : ''}
            {portfolioPercent != null && portfolioPercent > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                {portfolioPercent.toFixed(1)}% da carteira
              </span>
            )}
          </p>

          {/* Cotação atual — renda variável */}
          {hasCotacao && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {cotacaoLoading ? (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <RefreshCw size={11} className="animate-spin" />
                  Buscando cotação…
                </span>
              ) : cotacao ? (
                <>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatBRL(cotacao.precoCentavos)}
                  </span>
                  {cotacao.variacaoPercent != null && (
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${variacaoClass}`}>
                      {variacaoPositiva
                        ? <TrendingUp size={12} aria-hidden />
                        : <TrendingDown size={12} aria-hidden />}
                      {variacaoPositiva ? '+' : ''}{cotacao.variacaoPercent.toFixed(2)}% hoje
                    </span>
                  )}
                  {ultimaAtualizacao && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">
                      · atualizado {ultimaAtualizacao}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Cotação indisponível — verifique o ticker
                </span>
              )}
            </div>
          )}

          {/* Renda fixa / fundo / outro — aviso de preço manual */}
          {semCotacao && precoManualCentavos == null && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Insira o preço atual para ver resultado e rentabilidade
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDetalhe}>
            <Eye size={15} aria-hidden />
            Detalhe
          </Button>
          <Button type="button" size="sm" onClick={onOperacao}>
            <Plus size={15} aria-hidden />
            Operação
          </Button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-gray-100 dark:border-white/[0.04]" />

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-white/[0.04] sm:grid-cols-3 lg:grid-cols-6">
        <MetricCell label="Quantidade" value={ativo.posicao.quantidadeAtual} />
        <MetricCell label="Total investido" value={formatBRL(ativo.posicao.custoTotalCentavos)} />
        <MetricCell label="Preço médio" value={formatBRL(ativo.posicao.precoMedioCentavos)} />

        {/* Preço atual */}
        <div className="bg-white px-3 py-2.5 dark:bg-[#1A1A1A]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {hasCotacao && cotacao && precoManualCentavos == null ? 'Preço (auto)' : 'Preço atual'}
          </p>
          {hasCotacao && cotacao && precoManualCentavos == null ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatBRL(cotacao.precoCentavos)}
              </p>
              <button
                type="button"
                onClick={() => onPrecoManualChange(cotacao.precoCentavos)}
                className="mt-0.5 text-[10px] text-blue-500 hover:underline"
              >
                editar
              </button>
            </div>
          ) : (
            <div className="mt-1">
              <input
                type="number"
                min="0"
                step="0.01"
                value={precoManualCentavos == null ? '' : (precoManualCentavos / 100).toFixed(2)}
                onChange={(e) => onPrecoManualChange(parseMoneyInput(e.target.value))}
                placeholder={cotacao ? (cotacao.precoCentavos / 100).toFixed(2) : '0,00'}
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
              />
              {precoManualCentavos != null && hasCotacao && cotacao && (
                <button
                  type="button"
                  onClick={() => onPrecoManualChange(null)}
                  className="mt-0.5 text-[10px] text-gray-400 hover:text-blue-500 hover:underline"
                >
                  usar cotação
                </button>
              )}
            </div>
          )}
        </div>

        {/* Valor atual */}
        <MetricCell
          label="Valor atual"
          value={valorAtualCentavos == null ? '—' : formatBRL(valorAtualCentavos)}
        />

        {/* Resultado — destaque visual */}
        <div className={`bg-white px-3 py-2.5 dark:bg-[#1A1A1A] ${resultadoCentavos != null ? (resultadoPositivo ? 'border-l-2 border-emerald-400 dark:border-emerald-500' : 'border-l-2 border-red-400 dark:border-red-500') : ''}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Resultado
          </p>
          {resultadoCentavos == null ? (
            <p className="mt-1 text-sm font-bold text-gray-400">—</p>
          ) : (
            <div className="mt-1">
              <p className={`text-sm font-bold ${resultadoClass}`}>
                {resultadoPositivo ? '+' : ''}{formatBRL(resultadoCentavos)}
              </p>
              {rentabilidade != null && (
                <p className={`text-[10px] font-semibold ${resultadoClass}`}>
                  {rentabilidade >= 0 ? '+' : ''}{rentabilidade.toFixed(2)}%
                </p>
              )}
              {variacaoDiaCentavos != null && (
                <p className={`mt-0.5 text-[10px] ${variacaoClass}`}>
                  {variacaoPositiva ? '+' : ''}{formatBRL(variacaoDiaCentavos)} hoje
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCell({
  label,
  value,
  valueClassName = 'text-gray-900 dark:text-gray-100',
}: {
  label:           string
  value:           string
  valueClassName?: string
}) {
  return (
    <div className="bg-white px-3 py-2.5 dark:bg-[#1A1A1A]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMoneyInput(value: string): number | null {
  if (!value) return null
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}

function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)  return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}
