'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

type StatusFilter = 'all' | 'aberta' | 'fechada' | 'vencida' | 'paga'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'aberta', label: 'Abertas' },
  { value: 'fechada', label: 'Fechadas' },
  { value: 'vencida', label: 'Vencidas' },
  { value: 'paga', label: 'Pagas' },
]

export default function CartoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [contas, setContas] = useState<ContaDTO[]>([])
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
  const [faturas, setFaturas] = useState<FaturaCartaoDTO[]>([])
  const [selectedContaId, setSelectedContaId] = useState(() => searchParams.get('cartao') ?? 'all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => parseStatusFilter(searchParams.get('status')))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [compraOpen, setCompraOpen] = useState(false)
  const [detalheTarget, setDetalheTarget] = useState<FaturaCartaoDTO | null>(null)
  const [pagamentoTarget, setPagamentoTarget] = useState<FaturaCartaoDTO | null>(null)

  const cartoes = useMemo(() => contas.filter(conta => conta.tipo === 'credit'), [contas])
  const contasPagamento = useMemo(() => contas.filter(conta => conta.tipo !== 'credit'), [contas])
  const faturasFiltradas = useMemo(() => {
    return sortFaturas(
      faturas.filter(fatura => statusFilter === 'all' || fatura.status === statusFilter),
    )
  }, [faturas, statusFilter])

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

  const handleCancelamentoSuccess = useCallback(() => {
    loadBase()
    toast({
      type: 'success',
      title: 'Compra cancelada',
      description: 'As parcelas foram canceladas e o historico foi preservado.',
    })
  }, [loadBase, toast])

  const updateFiltersUrl = useCallback((next: { cartao?: string; status?: StatusFilter }) => {
    const params = new URLSearchParams(searchParams.toString())
    const cartao = next.cartao ?? selectedContaId
    const status = next.status ?? statusFilter

    if (cartao === 'all') params.delete('cartao')
    else params.set('cartao', cartao)

    if (status === 'all') params.delete('status')
    else params.set('status', status)

    const qs = params.toString()
    router.replace(qs ? `/dashboard/cartoes?${qs}` : '/dashboard/cartoes', { scroll: false })
  }, [router, searchParams, selectedContaId, statusFilter])

  const handleStatusFilterChange = useCallback((status: StatusFilter) => {
    setStatusFilter(status)
    updateFiltersUrl({ status })
  }, [updateFiltersUrl])

  const handleCartaoFilterChange = useCallback((cartao: string) => {
    setSelectedContaId(cartao)
    updateFiltersUrl({ cartao })
  }, [updateFiltersUrl])

  return (
    <div className="space-y-5">
      <CartoesHeader
        totalFaturas={faturasFiltradas.length}
        totalCartoes={cartoes.length}
        onNovaCompra={() => setCompraOpen(true)}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#111111]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Faturas</h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Filtre por cartao e acompanhe competencias, vencimentos e pagamentos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-[#151515]">
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => handleStatusFilterChange(filter.value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-white text-accent-blue shadow-sm dark:bg-[#1E1E1E]'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {cartoes.length > 1 && (
              <label className="flex min-w-[220px] flex-col gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Cartao
                <select
                  value={selectedContaId}
                  onChange={(event) => handleCartaoFilterChange(event.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
                >
                  <option value="all">Todos os cartoes</option>
                  {cartoes.map(cartao => (
                    <option key={cartao.id} value={cartao.id}>{cartao.nome}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </div>

      <FaturasList
        faturas={faturasFiltradas}
        loading={loading}
        error={error}
        hasCartoes={cartoes.length > 0}
        groupByCartao={selectedContaId === 'all' && cartoes.length > 1}
        isFiltered={statusFilter !== 'all'}
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
        onCancelSuccess={handleCancelamentoSuccess}
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

function sortFaturas(faturas: FaturaCartaoDTO[]) {
  return [...faturas].sort((a, b) => {
    const priority = statusPriority(a) - statusPriority(b)
    if (priority !== 0) return priority
    return dateValue(a.dataVencimento) - dateValue(b.dataVencimento)
  })
}

function statusPriority(fatura: FaturaCartaoDTO) {
  const overdue = fatura.status === 'vencida' || daysUntil(fatura.dataVencimento) < 0
  if (overdue) return 0
  if (fatura.status === 'paga') return 4
  if (fatura.status === 'aberta' || fatura.status === 'fechada') return 1
  return 3
}

function dateValue(value: string) {
  return new Date(value).getTime()
}

function daysUntil(value: string) {
  const due = new Date(value)
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((dueUtc - today) / 86_400_000)
}

function parseStatusFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.some(filter => filter.value === value)
    ? (value as StatusFilter)
    : 'all'
}
