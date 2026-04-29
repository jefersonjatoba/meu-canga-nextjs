'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { listContas } from '@/features/contas/api'
import { listCategorias } from '@/features/categorias/api'
import { CartoesHeader } from '@/features/cartao/components/CartoesHeader'
import { FaturasList } from '@/features/cartao/components/FaturasList'
import { CompraCartaoModal } from '@/features/cartao/components/CompraCartaoModal'
import { FaturaDetalheModal } from '@/features/cartao/components/FaturaDetalheModal'
import { PagarFaturaModal } from '@/features/cartao/components/PagarFaturaModal'
import { listarFaturasCartao } from '@/features/cartao/api'
import type { ContaDTO } from '@/features/contas/types'
import type { CategoriaDTO } from '@/features/categorias/types'
import type { FaturaCartaoDTO } from '@/features/cartao/types'

export default function CartoesPage() {
  const { toast } = useToast()
  const [contas, setContas] = useState<ContaDTO[]>([])
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
  const [faturas, setFaturas] = useState<FaturaCartaoDTO[]>([])
  const [selectedContaId, setSelectedContaId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [compraOpen, setCompraOpen] = useState(false)
  const [detalheTarget, setDetalheTarget] = useState<FaturaCartaoDTO | null>(null)
  const [pagamentoTarget, setPagamentoTarget] = useState<FaturaCartaoDTO | null>(null)

  const cartoes = useMemo(() => contas.filter(conta => conta.tipo === 'credit'), [contas])
  const contasPagamento = useMemo(() => contas.filter(conta => conta.tipo !== 'credit'), [contas])

  const loadBase = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      listContas(),
      listCategorias({ includeInactive: false }),
      listarFaturasCartao(selectedContaId === 'all' ? {} : { contaId: selectedContaId }),
    ])
      .then(([contasResult, categoriasResult, faturasResult]) => {
        setContas(contasResult)
        setCategorias(categoriasResult)
        setFaturas(faturasResult)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar cartoes')
      })
      .finally(() => setLoading(false))
  }, [selectedContaId])

  useEffect(() => {
    loadBase()
  }, [loadBase])

  const handleCompraSuccess = useCallback(() => {
    loadBase()
    toast({
      type: 'success',
      title: 'Compra registrada',
      description: 'As parcelas foram vinculadas as faturas do cartao.',
    })
  }, [loadBase, toast])

  const handlePagamentoSuccess = useCallback(() => {
    setPagamentoTarget(null)
    loadBase()
    toast({
      type: 'success',
      title: 'Pagamento registrado',
      description: 'A fatura foi atualizada sem gerar despesa duplicada.',
    })
  }, [loadBase, toast])

  return (
    <div className="space-y-5">
      <CartoesHeader
        totalFaturas={faturas.length}
        totalCartoes={cartoes.length}
        onNovaCompra={() => setCompraOpen(true)}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#111111]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Faturas</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Filtre por cartao e acompanhe competencias, vencimentos e pagamentos.
            </p>
          </div>

          <label className="flex min-w-[240px] flex-col gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Cartao
            <select
              value={selectedContaId}
              onChange={(event) => setSelectedContaId(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
            >
              <option value="all">Todos os cartoes</option>
              {cartoes.map(cartao => (
                <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <FaturasList
        faturas={faturas}
        loading={loading}
        error={error}
        hasCartoes={cartoes.length > 0}
        onDetalhe={setDetalheTarget}
        onPagar={setPagamentoTarget}
        onNovaCompra={() => setCompraOpen(true)}
      />

      <CompraCartaoModal
        open={compraOpen}
        onOpenChange={setCompraOpen}
        cartoes={cartoes}
        categorias={categorias}
        onSuccess={handleCompraSuccess}
      />

      <FaturaDetalheModal
        open={!!detalheTarget}
        onOpenChange={(open) => { if (!open) setDetalheTarget(null) }}
        fatura={detalheTarget}
      />

      <PagarFaturaModal
        open={!!pagamentoTarget}
        onOpenChange={(open) => { if (!open) setPagamentoTarget(null) }}
        fatura={pagamentoTarget}
        contasPagamento={contasPagamento}
        onSuccess={handlePagamentoSuccess}
      />
    </div>
  )
}
