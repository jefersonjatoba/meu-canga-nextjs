'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Trash2, XCircle } from 'lucide-react'

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
import { cancelarOperacaoInvestimento, excluirAtivoInvestimento } from '../api'
import type { InvestimentoAtivoDetalheDTO, InvestimentoOperacaoDTO } from '../types'

interface AtivoDetalheModalProps {
  ativo: InvestimentoAtivoDetalheDTO | null
  precoAtualCentavos: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (ativo: InvestimentoAtivoDetalheDTO) => void
  onDeleted: (ativoId: string) => void
}

export function AtivoDetalheModal({
  ativo,
  precoAtualCentavos,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: AtivoDetalheModalProps) {
  const [cancelTarget, setCancelTarget] = useState<InvestimentoOperacaoDTO | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const temOperacoesAtivas = ativo?.operacoes.some(op => op.status !== 'cancelada') ?? false

  const handleCancelOperacao = async () => {
    if (!cancelTarget) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await cancelarOperacaoInvestimento(cancelTarget.id)
      onUpdated(updated)
      setCancelTarget(null)
      setConfirmed(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cancelar a operação')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAtivo = async () => {
    if (!ativo) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await excluirAtivoInvestimento(ativo.id)
      setDeleteOpen(false)
      onOpenChange(false)
      onDeleted(ativo.id)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Não foi possível excluir o ativo')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* ── Modal principal ────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>{ativo ? `${ativo.nome} (${ativo.ticker})` : 'Detalhe do ativo'}</DialogTitle>
            <DialogDescription>
              Posição atual, custo médio e histórico de operações.
            </DialogDescription>
          </DialogHeader>

          {ativo && (
            <div className="space-y-5">
              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Metric label="Quantidade" value={ativo.posicao.quantidadeAtual} />
                <Metric label="Custo total" value={formatBRL(ativo.posicao.custoTotalCentavos)} />
                <Metric label="Preço médio" value={formatBRL(ativo.posicao.precoMedioCentavos)} />
                <Metric label="Valor atual" value={resumo ? formatBRL(resumo.valorAtualCentavos) : '—'} />
                <Metric
                  label="Rentabilidade"
                  value={resumo ? `${formatBRL(resumo.resultadoCentavos)} (${resumo.rentabilidade.toFixed(2)}%)` : '—'}
                  valueClassName={resumo && resumo.resultadoCentavos < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
                />
              </div>

              {/* Operações */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Operações
                </h3>
                {ativo.operacoes.length === 0 ? (
                  <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:border-white/[0.06] dark:bg-[#151515] dark:text-gray-400">
                    Nenhuma operação registrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ativo.operacoes.map(operacao => (
                      <OperacaoRow
                        key={operacao.id}
                        operacao={operacao}
                        onCancelar={() => {
                          setCancelTarget(operacao)
                          setError(null)
                          setConfirmed(false)
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Zona de exclusão */}
              <div className="border-t border-gray-200 pt-4 dark:border-white/[0.08]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Excluir ativo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {temOperacoesAtivas
                        ? 'Cancele todas as operações ativas para poder excluir.'
                        : 'Nenhuma operação ativa — exclusão disponível.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={temOperacoesAtivas}
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteConfirmed(false)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 size={14} aria-hidden />
                    Excluir ativo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirmar cancelamento de operação ─────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={(next) => {
        if (!next && !submitting) {
          setCancelTarget(null)
          setConfirmed(false)
          setError(null)
        }
      }}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Cancelar operação</DialogTitle>
            <DialogDescription>
              O registro é preservado com status &quot;cancelada&quot; e deixa de compor a posição.
            </DialogDescription>
          </DialogHeader>

          {cancelTarget && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-[#151515]">
                <p className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                  {cancelTarget.tipo} — {formatBRL(cancelTarget.valorTotalCentavos)}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {cancelTarget.quantidadeDecimal} un. em {formatDate(cancelTarget.dataOperacao)}
                </p>
              </div>

              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Esta ação não apaga o histórico nem desfaz lançamentos financeiros já criados.
                </p>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 rounded border-gray-300 dark:border-white/[0.10]"
                />
                <span>Confirmo que desejo cancelar esta operação</span>
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={submitting} onClick={() => {
              setCancelTarget(null)
              setConfirmed(false)
              setError(null)
            }}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!confirmed}
              isLoading={submitting}
              loadingText="Cancelando..."
              onClick={handleCancelOperacao}
            >
              <XCircle size={15} aria-hidden />
              Cancelar operação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirmar exclusão do ativo ─────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(next) => {
        if (!next && !deleting) {
          setDeleteOpen(false)
          setDeleteConfirmed(false)
          setDeleteError(null)
        }
      }}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Excluir ativo</DialogTitle>
            <DialogDescription>
              Esta ação é permanente e não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-[#151515]">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {ativo?.nome} ({ativo?.ticker})
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {ativo?.tipo} · {ativo?.corretora}
              </p>
            </div>

            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
              <p className="text-sm text-red-800 dark:text-red-200">
                O ativo e todas as operações canceladas serão removidos permanentemente. Lançamentos financeiros vinculados permanecem no módulo Lançamentos.
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-1 rounded border-gray-300 dark:border-white/[0.10]"
              />
              <span>Confirmo que desejo excluir este ativo permanentemente</span>
            </label>

            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
                <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => {
              setDeleteOpen(false)
              setDeleteConfirmed(false)
              setDeleteError(null)
            }}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!deleteConfirmed}
              isLoading={deleting}
              loadingText="Excluindo..."
              onClick={handleDeleteAtivo}
            >
              <Trash2 size={15} aria-hidden />
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function OperacaoRow({
  operacao,
  onCancelar,
}: {
  operacao: InvestimentoOperacaoDTO
  onCancelar: () => void
}) {
  const isCancelada = operacao.status === 'cancelada'
  const tipoColor: Record<string, string> = {
    compra:  'success',
    aporte:  'success',
    venda:   'warning',
    resgate: 'warning',
  }
  const badgeVariant = (tipoColor[operacao.tipo] ?? 'default') as 'success' | 'warning' | 'default'

  return (
    <div className={`rounded-lg border px-4 py-3 ${
      isCancelada
        ? 'border-gray-100 bg-gray-50 opacity-60 dark:border-white/[0.04] dark:bg-[#151515]'
        : 'border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#1A1A1A]'
    }`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariant} size="sm" className="capitalize">
              {operacao.tipo}
            </Badge>
            {isCancelada && (
              <Badge variant="default" size="sm">cancelada</Badge>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(operacao.dataOperacao)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {operacao.quantidadeDecimal} un. · {formatBRL(operacao.precoUnitarioCentavos)}/un.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {formatBRL(operacao.valorTotalCentavos)}
          </p>
          {!isCancelada && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelar}
            >
              <XCircle size={13} aria-hidden />
              Cancelar operação
            </Button>
          )}
        </div>
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
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-[#151515]">
      <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-sm font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}
