'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatBRL } from '@/lib/money'
import { obterFaturaCartao } from '../api'
import type { FaturaCartaoDTO, FaturaCartaoDetalheDTO } from '../types'

interface FaturaDetalheModalProps {
  fatura: FaturaCartaoDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FaturaDetalheModal({ fatura, open, onOpenChange }: FaturaDetalheModalProps) {
  const [detalhe, setDetalhe] = useState<FaturaCartaoDetalheDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !fatura) return

    setLoading(true)
    setError(null)
    obterFaturaCartao(fatura.id)
      .then(setDetalhe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar fatura'))
      .finally(() => setLoading(false))
  }, [fatura, open])

  return (
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
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Resumo label="Status" value={detalhe.status} />
              <Resumo label="Vencimento" value={formatDate(detalhe.dataVencimento)} />
              <Resumo label="Total" value={formatBRL(detalhe.totalCentavos)} strong />
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Parcelas</h3>
              {detalhe.parcelas.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma parcela vinculada.</p>
              ) : (
                <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  {detalhe.parcelas.map(parcela => (
                    <div key={parcela.id} className="grid gap-3 bg-white p-4 dark:bg-[#111111] sm:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {parcela.compraCartao.descricao}
                          </p>
                          <Badge variant="outline" size="sm">
                            {parcela.numero}/{parcela.totalParcelas}
                          </Badge>
                          <Badge variant={parcela.status === 'lancada' ? 'primary' : 'default'} size="sm">
                            {parcela.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {parcela.compraCartao.categoria} - vence em {formatDate(parcela.dataVencimento)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatBRL(parcela.valorCentavos)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Pagamentos</h3>
              {detalhe.pagamentos.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum pagamento registrado.</p>
              ) : (
                <div className="space-y-2">
                  {detalhe.pagamentos.map(pagamento => (
                    <div key={pagamento.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-[#111111]">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {pagamento.contaPagamento?.nome ?? 'Conta de pagamento'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(pagamento.dataPagamento)}</p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatBRL(pagamento.valorCentavos)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Resumo({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#151515]">
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
