'use client'

import { Eye, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/money'
import type { InvestimentoAtivoDetalheDTO } from '../types'

interface AtivoItemProps {
  ativo: InvestimentoAtivoDetalheDTO
  precoAtualCentavos: number | null
  onPrecoAtualChange: (value: number | null) => void
  onDetalhe: () => void
  onOperacao: () => void
}

export function AtivoItem({
  ativo,
  precoAtualCentavos,
  onPrecoAtualChange,
  onDetalhe,
  onOperacao,
}: AtivoItemProps) {
  const quantidade = Number(ativo.posicao.quantidadeAtual)
  const valorAtualCentavos = precoAtualCentavos == null
    ? 0
    : Math.round(quantidade * precoAtualCentavos)
  const resultadoCentavos = precoAtualCentavos == null
    ? 0
    : valorAtualCentavos - ativo.posicao.custoTotalCentavos
  const rentabilidade = precoAtualCentavos == null || ativo.posicao.custoTotalCentavos <= 0
    ? null
    : (resultadoCentavos / ativo.posicao.custoTotalCentavos) * 100
  const resultadoClass = resultadoCentavos >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-[#111111] dark:hover:border-gray-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ativo.nome}</h3>
            <Badge variant="outline" size="sm">{ativo.ticker}</Badge>
            <Badge variant={ativo.ativo ? 'success' : 'default'} size="sm">
              {ativo.ativo ? 'ativo' : 'inativo'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {ativo.tipo} - {ativo.moeda}{ativo.corretora ? ` - ${ativo.corretora}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDetalhe}>
            <Eye size={15} aria-hidden />
            Detalhe
          </Button>
          <Button type="button" size="sm" onClick={onOperacao}>
            <Plus size={15} aria-hidden />
            Operacao
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric label="Quantidade" value={ativo.posicao.quantidadeAtual} />
        <Metric label="Custo" value={formatBRL(ativo.posicao.custoTotalCentavos)} />
        <Metric label="Preco medio" value={formatBRL(ativo.posicao.precoMedioCentavos)} />
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#151515]">
          <label className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500" htmlFor={`preco-${ativo.id}`}>
            Preco atual
          </label>
          <input
            id={`preco-${ativo.id}`}
            type="number"
            min="0"
            step="0.01"
            value={precoAtualCentavos == null ? '' : (precoAtualCentavos / 100).toFixed(2)}
            onChange={(event) => onPrecoAtualChange(parseMoneyInput(event.target.value))}
            placeholder="0,00"
            className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
        </div>
        <Metric label="Valor atual" value={precoAtualCentavos == null ? 'manual' : formatBRL(valorAtualCentavos)} />
        <Metric
          label="Resultado"
          value={precoAtualCentavos == null ? 'manual' : `${formatBRL(resultadoCentavos)}${rentabilidade == null ? '' : ` (${rentabilidade.toFixed(2)}%)`}`}
          valueClassName={precoAtualCentavos == null ? undefined : resultadoClass}
        />
      </div>
    </article>
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
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#151515]">
      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function parseMoneyInput(value: string): number | null {
  if (!value) return null
  const parsed = Number(value.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed * 100)
}
