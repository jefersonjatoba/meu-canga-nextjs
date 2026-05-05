'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatBRL } from '@/lib/money'
import { cancelarCompraCartao, obterFaturaCartao } from '../api'
import type {
  CompraCartaoDTO,
  FaturaCartaoDTO,
  FaturaCartaoDetalheDTO,
  ParcelaCartaoDTO,
} from '../types'

interface FaturaDetalheModalProps {
  fatura: FaturaCartaoDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelSuccess?: () => void
}

interface CompraGrupo {
  compra: CompraCartaoDTO
  parcelas: ParcelaCartaoDTO[]
  valorNaFaturaCentavos: number
  elegibilidade: {
    podeCancelar: boolean
    motivo?: string
  }
}

export function FaturaDetalheModal({
  fatura,
  open,
  onOpenChange,
  onCancelSuccess,
}: FaturaDetalheModalProps) {
  const [detalhe, setDetalhe] = useState<FaturaCartaoDetalheDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CompraGrupo | null>(null)
  const [cancelConfirmed, setCancelConfirmed] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  const loadDetalhe = useCallback(async () => {
    if (!open || !fatura) return

    setLoading(true)
    setError(null)

    try {
      const nextDetalhe = await obterFaturaCartao(fatura.id)
      setDetalhe(nextDetalhe)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar fatura')
    } finally {
      setLoading(false)
    }
  }, [fatura, open])

  useEffect(() => {
    loadDetalhe()
  }, [loadDetalhe])

  const handleCancelCompra = async () => {
    if (!cancelTarget) return

    setCancelSubmitting(true)
    setCancelError(null)

    try {
      await cancelarCompraCartao(cancelTarget.compra.id)
      setCancelTarget(null)
      setCancelConfirmed(false)
      await loadDetalhe()
      onCancelSuccess?.()
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : 'Nao foi possivel cancelar esta compra')
    } finally {
      setCancelSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="xl" className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fatura {fatura?.competencia}</DialogTitle>
            <DialogDescription>
              Compras, parcelas e pagamentos vinculados a esta fatura.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && detalhe && (
            <FaturaDetalheContent detalhe={detalhe} onCancelarCompra={setCancelTarget} />
          )}
        </DialogContent>
      </Dialog>

      <CancelarCompraDialog
        target={cancelTarget}
        confirmed={cancelConfirmed}
        error={cancelError}
        submitting={cancelSubmitting}
        onConfirmedChange={setCancelConfirmed}
        onClose={() => {
          if (cancelSubmitting) return
          setCancelTarget(null)
          setCancelConfirmed(false)
          setCancelError(null)
        }}
        onConfirm={handleCancelCompra}
      />
    </>
  )
}

function FaturaDetalheContent({
  detalhe,
  onCancelarCompra,
}: {
  detalhe: FaturaCartaoDetalheDTO
  onCancelarCompra: (target: CompraGrupo) => void
}) {
  const totalPago = detalhe.pagamentos
    .filter(pagamento => pagamento.status === 'confirmado')
    .reduce((acc, pagamento) => acc + pagamento.valorCentavos, 0)
  const restante = Math.max(0, detalhe.totalCentavos - totalPago)
  const grupos = useMemo(() => groupParcelasByCompra(detalhe), [detalhe])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Total da fatura
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatBRL(detalhe.totalCentavos)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <Resumo label="Pago" value={formatBRL(totalPago)} />
            <Resumo label="Restante" value={formatBRL(restante)} strong />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Resumo label="Status" value={detalhe.status} />
        <Resumo label="Vencimento" value={formatDate(detalhe.dataVencimento)} />
        <Resumo label="Total" value={formatBRL(detalhe.totalCentavos)} strong />
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
          Compras e parcelas
        </h3>

        {grupos.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 dark:border-white/[0.06] dark:bg-[#1A1A1A] dark:text-gray-400">
            Nenhuma parcela vinculada.
          </p>
        ) : (
          <div className="grid gap-3">
            {grupos.map(grupo => (
              <div key={grupo.compra.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-[#1A1A1A]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {grupo.compra.descricao}
                        </p>
                        <Badge variant={grupo.compra.status === 'ativa' ? 'primary' : 'default'} size="sm">
                          {grupo.compra.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {grupo.compra.categoria} - {grupo.compra.quantidadeParcelas} parcela{grupo.compra.quantidadeParcelas !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {formatBRL(grupo.valorNaFaturaCentavos)}
                      </p>
                      {grupo.elegibilidade.podeCancelar ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelarCompra(grupo)}
                        >
                          Cancelar compra
                        </Button>
                      ) : grupo.elegibilidade.motivo ? (
                        <p className="max-w-[260px] text-left text-xs text-gray-500 dark:text-gray-400 sm:text-right">
                          {grupo.elegibilidade.motivo}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {grupo.parcelas.map(parcela => (
                    <div key={parcela.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/[0.06] dark:bg-[#151515]">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" size="sm">
                            Parcela {parcela.numero}/{parcela.totalParcelas}
                          </Badge>
                          <Badge variant={parcela.status === 'lancada' ? 'primary' : 'default'} size="sm">
                            {parcela.status}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            vencimento {formatDate(parcela.dataVencimento)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatBRL(parcela.valorCentavos)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Pagamentos</h3>
        {detalhe.pagamentos.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 dark:border-white/[0.06] dark:bg-[#1A1A1A] dark:text-gray-400">
            Nenhum pagamento registrado.
          </p>
        ) : (
          <div className="space-y-2">
            {detalhe.pagamentos.map(pagamento => (
              <div key={pagamento.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#1A1A1A]">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pagamento.contaPagamento?.nome ?? 'Conta de pagamento'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(pagamento.dataPagamento)}
                  </p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatBRL(pagamento.valorCentavos)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CancelarCompraDialog({
  target,
  confirmed,
  error,
  submitting,
  onConfirmedChange,
  onClose,
  onConfirm,
}: {
  target: CompraGrupo | null
  confirmed: boolean
  error: string | null
  submitting: boolean
  onConfirmedChange: (value: boolean) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Cancelar compra</DialogTitle>
          <DialogDescription>
            Revise os dados antes de cancelar esta compra no cartao.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.06] dark:bg-[#151515]">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {target.compra.descricao}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Resumo label="Valor total" value={formatBRL(target.compra.valorTotalCentavos)} strong />
                <Resumo label="Parcelas" value={String(target.compra.quantidadeParcelas)} />
                <Resumo label="Status" value={target.compra.status} />
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Esta acao cancela as parcelas em faturas abertas e remove o impacto no seu dashboard. O historico sera preservado.
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => onConfirmedChange(event.target.checked)}
                className="mt-1 rounded border-gray-300 dark:border-white/[0.10]"
              />
              <span>Confirmo que desejo cancelar esta compra</span>
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Voltar
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!confirmed}
            isLoading={submitting}
            loadingText="Cancelando..."
            onClick={onConfirm}
          >
            Cancelar compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function groupParcelasByCompra(detalhe: FaturaCartaoDetalheDTO): CompraGrupo[] {
  const groups = new Map<string, CompraGrupo>()

  for (const parcela of detalhe.parcelas) {
    const compra = parcela.compraCartao
    const current = groups.get(compra.id) ?? {
      compra,
      parcelas: [],
      valorNaFaturaCentavos: 0,
      elegibilidade: { podeCancelar: false },
    }

    current.parcelas.push(parcela)
    current.valorNaFaturaCentavos += parcela.valorCentavos
    groups.set(compra.id, current)
  }

  return Array.from(groups.values()).map(grupo => ({
    ...grupo,
    elegibilidade: getCancelEligibility(detalhe, grupo),
  }))
}

function getCancelEligibility(
  detalhe: FaturaCartaoDetalheDTO,
  grupo: Pick<CompraGrupo, 'compra' | 'parcelas'>,
): CompraGrupo['elegibilidade'] {
  if (grupo.compra.status !== 'ativa') {
    return { podeCancelar: false, motivo: 'Compra ja cancelada.' }
  }
  if (detalhe.status !== 'aberta') {
    return { podeCancelar: false, motivo: 'Cancelamento disponivel apenas em faturas abertas.' }
  }
  if (detalhe.pagamentos.length > 0) {
    return { podeCancelar: false, motivo: 'Fatura com pagamento registrado nao permite cancelamento.' }
  }
  if (grupo.parcelas.some(parcela => !['lancada', 'prevista'].includes(parcela.status))) {
    return { podeCancelar: false, motivo: 'Compra possui parcelas em estado nao cancelavel.' }
  }
  if (grupo.parcelas.some(parcela => !parcela.lancamentoId)) {
    return { podeCancelar: false, motivo: 'Compra sem lancamento vinculado nao permite cancelamento seguro.' }
  }

  return { podeCancelar: true }
}

function Resumo({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/[0.06] dark:bg-[#151515]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">{label}</p>
      <p className={`mt-1 text-sm ${strong ? 'font-bold' : 'font-semibold'} text-gray-900 dark:text-gray-100`}>
        {value}
      </p>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}
