'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import type { InvestimentoAtivoDetalheDTO } from '../types'
import type { CotacoesMap } from '../hooks/useCotacoes'
import { AtivoItem } from './AtivoItem'
import { InvestimentosEmptyState } from './InvestimentosEmptyState'

interface AtivosListProps {
  ativos:              InvestimentoAtivoDetalheDTO[]
  loading:             boolean
  cotacoesLoading:     boolean
  error:               string | null
  cotacoes:            CotacoesMap
  precosManual:        Record<string, number | null>
  precosEfetivos:      Record<string, number | null>
  patrimonioCentavos:  number
  onPrecoManualChange: (ativoId: string, value: number | null) => void
  onNovoAtivo:         () => void
  onDetalhe:           (ativo: InvestimentoAtivoDetalheDTO) => void
  onOperacao:          (ativo: InvestimentoAtivoDetalheDTO) => void
}

export function AtivosList({
  ativos,
  loading,
  cotacoesLoading,
  error,
  cotacoes,
  precosManual,
  precosEfetivos,
  patrimonioCentavos,
  onPrecoManualChange,
  onNovoAtivo,
  onDetalhe,
  onOperacao,
}: AtivosListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Erro ao carregar investimentos</p>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (ativos.length === 0) {
    return <InvestimentosEmptyState onNovoAtivo={onNovoAtivo} />
  }

  return (
    <div className="space-y-3">
      {ativos.map(ativo => {
        const precoAtual = precosEfetivos[ativo.id]
        const valorAtual = precoAtual != null
          ? Math.round(Number(ativo.posicao.quantidadeAtual) * precoAtual)
          : null
        const portfolioPercent = patrimonioCentavos > 0 && valorAtual != null
          ? (valorAtual / patrimonioCentavos) * 100
          : null

        return (
          <AtivoItem
            key={ativo.id}
            ativo={ativo}
            cotacao={cotacoes[ativo.ticker.toUpperCase()] ?? null}
            cotacaoLoading={cotacoesLoading}
            precoManualCentavos={precosManual[ativo.id] ?? null}
            portfolioPercent={portfolioPercent}
            onPrecoManualChange={(value) => onPrecoManualChange(ativo.id, value)}
            onDetalhe={() => onDetalhe(ativo)}
            onOperacao={() => onOperacao(ativo)}
          />
        )
      })}
    </div>
  )
}
