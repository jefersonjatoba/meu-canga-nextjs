'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  TrendingDown,
  ShieldCheck,
  Tag,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { cardGradientStyle } from '@/lib/bank-config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaturaLancamento {
  id: string
  descricao: string
  tipo: string
  categoria: string
  valorCentavos: number
  data: string // YYYY-MM-DD
}

interface CategoriaItem {
  categoria: string
  totalCentavos: number
  count: number
  percent: number
}

interface FaturaData {
  conta: {
    id: string
    nome: string
    cor: string | null
    limiteCentavos: number
    diaFechamento: number
    diaVencimento: number
  }
  ciclo: {
    abertura: string
    fechamento: string
    vencimento: string
    status: 'aberta' | 'fechada' | 'vencida'
    label: string
  }
  totais: {
    totalFaturaCentavos: number
    totalDespesasCentavos: number
    totalCreditosCentavos: number
    limiteCentavos: number
    disponivelCentavos: number
    percentUsado: number
  }
  lancamentos: FaturaLancamento[]
  porCategoria: CategoriaItem[]
  cicloAnterior: string | null
  proximoCiclo: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

function formatDateFull(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function statusConfig(status: FaturaData['ciclo']['status']) {
  if (status === 'aberta')  return { label: 'Aberta',  cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' }
  if (status === 'fechada') return { label: 'Fechada', cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' }
  return { label: 'Vencida', cls: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' }
}

const CATEGORY_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#161616] px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} style={{ color: accent }} />
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function ProgressBar({ percent, status }: { percent: number; status: FaturaData['ciclo']['status'] }) {
  const color = percent > 80 ? '#ef4444' : percent > 50 ? '#f59e0b' : '#22c55e'
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#161616] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Limite utilizado</p>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      {status === 'aberta' && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">Fatura em aberto — novos lançamentos podem aumentar o total</p>
      )}
      {status === 'fechada' && (
        <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1.5">Fatura fechada — aguardando pagamento até o vencimento</p>
      )}
      {status === 'vencida' && (
        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1.5">Fatura vencida — realize o pagamento para evitar juros</p>
      )}
    </div>
  )
}

function CategoriaList({ itens }: { itens: CategoriaItem[] }) {
  if (itens.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#161616] px-4 py-6 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum gasto neste ciclo</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#161616] overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-gray-400 dark:text-gray-500" />
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Por Categoria</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
        {itens.map((item, i) => {
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
          return (
            <div key={item.categoria} className="px-4 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.categoria}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{item.count}x</span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{formatBRL(item.totalCentavos)}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1.5">{item.percent}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-gray-100 dark:bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.percent}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LancamentosList({ lancamentos }: { lancamentos: FaturaLancamento[] }) {
  if (lancamentos.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#161616] px-4 py-8 text-center">
        <CreditCard size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum lançamento neste ciclo</p>
      </div>
    )
  }

  // Group by date
  const groups: Record<string, FaturaLancamento[]> = {}
  for (const l of lancamentos) {
    groups[l.data] ??= []
    groups[l.data].push(l)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#161616] overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <CreditCard size={12} className="text-gray-400 dark:text-gray-500" />
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Lançamentos — {lancamentos.length} {lancamentos.length === 1 ? 'transação' : 'transações'}
          </p>
        </div>
      </div>
      <div>
        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="px-4 py-1.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.04]">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {formatDate(date)}
              </p>
            </div>
            {items.map(l => (
              <div
                key={l.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.04] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{l.descricao}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{l.categoria || 'Sem categoria'}</p>
                </div>
                <p className={`text-sm font-semibold tabular-nums shrink-0 ${l.tipo === 'income' ? 'text-green-500 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                  {l.tipo === 'income' ? '+' : '-'}{formatBRL(l.valorCentavos)}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function FaturaPageContent() {
  const params = useParams<{ contaId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [data, setData]       = useState<FaturaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const contaId = params.contaId
  const ciclo   = searchParams.get('ciclo') ?? ''

  const fetchFatura = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = ciclo ? `?ciclo=${ciclo}` : ''
      const res = await fetch(`/api/fatura/${contaId}${qs}`)
      const body = await res.json()
      if (!body.success) throw new Error(body.error ?? 'Erro ao carregar fatura')
      setData(body.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [contaId, ciclo])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchFatura()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchFatura])

  function navigate(fechamento: string) {
    router.push(`/dashboard/fatura/${contaId}?ciclo=${fechamento}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/[0.06] px-4 py-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error ?? 'Fatura não encontrada'}</p>
        </div>
        <Link href="/dashboard/contas" className="mt-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft size={14} />
          Voltar para Contas
        </Link>
      </div>
    )
  }

  const { conta, ciclo: cycle, totais, lancamentos, porCategoria, cicloAnterior, proximoCiclo } = data
  const gradient = cardGradientStyle(conta.cor)
  const st = statusConfig(cycle.status)

  return (
    <div className="space-y-4 p-5 sm:p-6 max-w-2xl mx-auto">

      {/* Back */}
      <Link
        href="/dashboard/contas"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={14} />
        Contas
      </Link>

      {/* Card header */}
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.07]">
        {/* Gradient top */}
        <div className="px-4 py-4 relative overflow-hidden" style={{ background: gradient }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/[0.06] pointer-events-none" />
          <div className="absolute -bottom-8 right-4 w-16 h-16 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[9px] text-white/50 tracking-widest uppercase mb-0.5">Cartão de Crédito</p>
            <p className="text-lg font-bold text-white">{conta.nome}</p>
          </div>
        </div>

        {/* Cycle navigation bar */}
        <div className="bg-white dark:bg-[#161616] px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => cicloAnterior && navigate(cicloAnterior)}
            disabled={!cicloAnterior}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Ciclo anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cycle.label}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {formatDate(cycle.abertura)} → {formatDate(cycle.fechamento)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>
              {st.label}
            </span>
            <button
              type="button"
              onClick={() => proximoCiclo && navigate(proximoCiclo)}
              disabled={!proximoCiclo}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Próximo ciclo"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total Fatura"
          value={formatBRL(totais.totalFaturaCentavos)}
          sub={totais.totalCreditosCentavos > 0 ? `${formatBRL(totais.totalCreditosCentavos)} em créditos` : undefined}
          icon={TrendingDown}
          accent="#ef4444"
        />
        <KpiCard
          label="Limite Total"
          value={formatBRL(totais.limiteCentavos)}
          icon={CreditCard}
          accent="#6366f1"
        />
        <KpiCard
          label="Disponível"
          value={formatBRL(totais.disponivelCentavos)}
          icon={ShieldCheck}
          accent="#22c55e"
        />
        <KpiCard
          label="Vencimento"
          value={formatDate(cycle.vencimento)}
          sub={formatDateFull(cycle.vencimento)}
          icon={Calendar}
          accent="#f59e0b"
        />
      </div>

      {/* Limit bar */}
      {totais.limiteCentavos > 0 && (
        <ProgressBar percent={totais.percentUsado} status={cycle.status} />
      )}

      {/* Category breakdown */}
      <CategoriaList itens={porCategoria} />

      {/* Transactions */}
      <LancamentosList lancamentos={lancamentos} />

    </div>
  )
}

export default function FaturaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    }>
      <FaturaPageContent />
    </Suspense>
  )
}
