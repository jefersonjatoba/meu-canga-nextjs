'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { formatBRL } from '@/lib/money'
import { cancelarOperacaoInvestimento } from '../api'
import type { InvestimentoAtivoDetalheDTO, InvestimentoOperacaoDTO } from '../types'

interface AtivoDetalheModalProps {
  ativo: InvestimentoAtivoDetalheDTO | null
  precoAtualCentavos: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (ativo: InvestimentoAtivoDetalheDTO) => void
}

export function AtivoDetalheModal({
  ativo,
  precoAtualCentavos,
  open,
  onOpenChange,
  onUpdated,
}: AtivoDetalheModalProps) {
  const [cancelTarget, setCancelTarget] = useState<InvestimentoOperacaoDTO | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resumo = useMemo(() => {
    if (!ativo || precoAtualCentavos == null) return null
    const quantidade = Number(ativo.posicao.quantidadeAtual)
    const valorAtualCentavos = Math.round(quantidade * precoAtualCentavos)
    const resultadoCentavos = valorAtualCentavos - ativo.posicao.custoTotalCentavos
    const rentabilidade = ativo.posicao.custoTotalCentavos > 0
      ? (resultadoCentavos / ativo.posicao.custoTotalCentavos) * 100
      : 0
    return { valorAtualCentavos, resultadoCentavos, rentabilidade }
  }, [ativo, precoAtualCentavos])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setSubmitting(true)
    setError(null)

    try {
      const updated = await cancelarOperacaoInvestimento(cancelTarget.id)
      onUpdated(updated)
      setCancelTarget(null)
      setConfirmed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nao foi possivel cancelar a operacao')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="xl" className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ativo ? `${ativo.nome} (${ativo.ticker})` : 'Detalhe do ativo'}</DialogTitle>
            <DialogDescription>
              Posicao atual, custo medio e historico operacional.
            </DialogDescription>
          </DialogHeader>

          {ativo && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="Quantidade" value={ativo.posicao.quantidadeAtual} />
                <Metric label="Custo total" value={formatBRL(ativo.posicao.custoTotalCentavos)} />
                <Metric label="Preco medio" value={formatBRL(ativo.posicao.precoMedioCentavos)} />
                <Metric label="Valor atual" value={resumo ? formatBRL(resumo.valorAtualCentavos) : 'manual'} />
                <Metric
                  label="Rentabilidade"
                  value={resumo ? `${formatBRL(resumo.resultadoCentavos)} (${resumo.rentabilidade.toFixed(2)}%)` : 'manual'}
                  valueClassName={resumo && resumo.resultadoCentavos < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
                />
              </div>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Operacoes
                </h3>
                {ativo.operacoes.length === 0 ? (
                  <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 dark:bg-[#151515] dark:text-gray-400">
                    Nenhuma operacao registrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ativo.operacoes.map(operacao => (
                      <div key={operacao.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#111111]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={operacao.tipo === 'compra' ? 'success' : 'warning'} size="sm">
                                {operacao.tipo}
                              </Badge>
                              <Badge variant={operacao.status === 'cancelada' ? 'default' : 'primary'} size="sm">
                                {operacao.status}
                              </Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(operacao.dataOperacao)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                              {operacao.quantidadeDecimal} un. - {formatBRL(operacao.precoUnitarioCentavos)} por unidade
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:items-end">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {formatBRL(operacao.valorTotalCentavos)}
                            </p>
                            {operacao.status !== 'cancelada' && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCancelTarget(operacao)
                                  setError(null)
                                  setConfirmed(false)
                                }}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelTarget} onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) {
          setCancelTarget(null)
          setConfirmed(false)
          setError(null)
        }
      }}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Cancelar operacao</DialogTitle>
            <DialogDescription>
              O registro sera mantido com status cancelada e deixara de compor a posicao.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-[#151515]">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {cancelTarget.tipo} - {formatBRL(cancelTarget.valorTotalCentavos)}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {cancelTarget.quantidadeDecimal} unidades em {formatDate(cancelTarget.dataOperacao)}
                </p>
              </div>

              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Esta acao nao apaga historico e nao cria lancamento financeiro.
                </p>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600"
                />
                <span>Confirmo que desejo cancelar esta operacao</span>
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setCancelTarget(null)
                setConfirmed(false)
                setError(null)
              }}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!confirmed}
              isLoading={submitting}
              loadingText="Cancelando..."
              onClick={handleCancel}
            >
              Cancelar operacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#151515]">
      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-sm font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}
