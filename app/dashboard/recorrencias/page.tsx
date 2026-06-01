'use client'

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AlertCircle, ArrowRight, Plus, Repeat2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CategorySelect, OUTROS_CATEGORIA } from '@/components/ui/CategorySelect'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { resolveCategorySelection, resolveInitialCategoryValue } from '@/lib/categories'
import { formatBRL, toCents } from '@/lib/money'
import { listCategorias } from '@/features/categorias/api'
import type { CategoriaDTO } from '@/features/categorias/types'
import { listContas } from '@/features/contas/api'
import type { ContaDTO } from '@/features/contas/types'
import {
  createRecorrencia,
  listRecorrencias,
  processarRecorrencias,
  toggleRecorrencia,
  updateRecorrencia,
} from '@/features/recorrencias/api'
import {
  FREQUENCIA_LABELS,
  FREQUENCIAS_RECORRENCIA,
  type CreateRecorrenciaInput,
  type FrequenciaRecorrencia,
  type RecorrenciaDTO,
} from '@/features/recorrencias/types'

type StatusVisual = 'ativa' | 'vence_hoje' | 'vencida' | 'pausada' | 'encerrada' | 'futura'

type RecorrenciaVisualStatus = {
  label: string
  variant: BadgeVariant
  title: string
  key: StatusVisual
}

type FilterTab = 'todas' | StatusVisual

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'ativa', label: 'Ativas' },
  { key: 'vence_hoje', label: 'Vence hoje' },
  { key: 'vencida', label: 'Vencidas' },
  { key: 'pausada', label: 'Pausadas' },
  { key: 'encerrada', label: 'Encerradas' },
]

type RecorrenciaFormState = {
  contaId: string
  categoriaId: string
  categoriaManual: string
  descricao: string
  tipo: 'income' | 'expense'
  valorDisplay: string
  frequencia: FrequenciaRecorrencia
  diaVencimento: string
  dataInicio: string
  dataFim: string
}

export default function RecorrenciasPage() {
  const { toast } = useToast()
  const [recorrencias, setRecorrencias] = useState<RecorrenciaDTO[]>([])
  const [contas, setContas] = useState<ContaDTO[]>([])
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RecorrenciaDTO | null>(null)
  const [processing, setProcessing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todas')

  const contasFinanceiras = useMemo(
    () => contas.filter(conta => conta.tipo !== 'credit' && conta.ativa),
    [contas],
  )
  const hasCartoesCredito = useMemo(
    () => contas.some(conta => conta.tipo === 'credit' && conta.ativa),
    [contas],
  )

  const loadBase = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      listRecorrencias(),
      listContas(),
      listCategorias({ includeInactive: false }),
    ])
      .then(([recorrenciasResult, contasResult, categoriasResult]) => {
        setRecorrencias(recorrenciasResult)
        setContas(contasResult)
        setCategorias(categoriasResult)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar recorrências')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadBase()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBase])

  const recorrenciasComStatus = useMemo(
    () =>
      recorrencias.map(r => ({
        recorrencia: r,
        status: getRecorrenciaVisualStatus(r),
      })),
    [recorrencias],
  )

  const kpis = useMemo(() => {
    const hoje = todayBR()
    let ativas = 0
    let vencidas = 0
    let receitasMes = 0
    let despesasMes = 0

    for (const { recorrencia: r, status } of recorrenciasComStatus) {
      if (status.key === 'vencida') vencidas++
      if (status.key === 'ativa' || status.key === 'vence_hoje') ativas++

      if (r.ativa && r.proximaExecucao) {
        const mesProxima = r.proximaExecucao.slice(0, 7)
        const mesAtual = hoje.slice(0, 7)
        if (mesProxima === mesAtual) {
          if (r.tipo === 'income') receitasMes += r.valorCentavos
          else despesasMes += r.valorCentavos
        }
      }
    }

    return { ativas, vencidas, receitasMes, despesasMes }
  }, [recorrenciasComStatus])

  const filteredAndSorted = useMemo(() => {
    const filtered = activeFilter === 'todas'
      ? recorrenciasComStatus
      : recorrenciasComStatus.filter(({ status }) => status.key === activeFilter)

    return [...filtered].sort((a, b) => {
      // vencidas no topo
      const aVencida = a.status.key === 'vencida' ? 0 : a.status.key === 'vence_hoje' ? 1 : 2
      const bVencida = b.status.key === 'vencida' ? 0 : b.status.key === 'vence_hoje' ? 1 : 2
      if (aVencida !== bVencida) return aVencida - bVencida

      // depois por próxima execução asc
      const aDate = a.recorrencia.proximaExecucao ?? '9999'
      const bDate = b.recorrencia.proximaExecucao ?? '9999'
      return aDate.localeCompare(bDate)
    })
  }, [recorrenciasComStatus, activeFilter])

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<FilterTab, number>> = { todas: recorrenciasComStatus.length }
    for (const { status } of recorrenciasComStatus) {
      counts[status.key] = (counts[status.key] ?? 0) + 1
    }
    return counts
  }, [recorrenciasComStatus])

  const handleCreateSuccess = useCallback(() => {
    setCreateOpen(false)
    loadBase()
    toast({ type: 'success', title: 'Recorrência criada', description: 'Template financeiro salvo com sucesso.' })
  }, [loadBase, toast])

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null)
    loadBase()
    toast({ type: 'success', title: 'Recorrência atualizada', description: 'Alterações salvas.' })
  }, [loadBase, toast])

  const handleToggle = useCallback(async (recorrencia: RecorrenciaDTO) => {
    try {
      await toggleRecorrencia(recorrencia.id)
      loadBase()
      toast({ type: 'success', title: recorrencia.ativa ? 'Recorrência pausada' : 'Recorrência reativada' })
    } catch (e) {
      toast({ type: 'error', title: 'Erro ao atualizar', description: e instanceof Error ? e.message : 'Não foi possível atualizar.' })
    }
  }, [loadBase, toast])

  const handleProcessar = useCallback(async () => {
    setProcessing(true)
    try {
      const result = await processarRecorrencias()
      const description = result.lancamentosCriados > 0
        ? `${result.lancamentosCriados} lançamento${result.lancamentosCriados !== 1 ? 's' : ''} gerado${result.lancamentosCriados !== 1 ? 's' : ''}.`
        : 'Nenhuma nova recorrência para processar.'
      loadBase()
      toast({ type: 'success', title: result.lancamentosCriados > 0 ? 'Recorrências processadas' : 'Tudo em dia', description })
    } catch (e) {
      toast({ type: 'error', title: 'Erro ao processar', description: e instanceof Error ? e.message : 'Não foi possível processar agora.' })
    } finally {
      setProcessing(false)
    }
  }, [loadBase, toast])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recorrências</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Centro de previsibilidade financeira — salário, aluguel e contas fixas em um lugar.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleProcessar}
            isLoading={processing}
            loadingText="Processando..."
            title="Processa recorrências vencidas sem duplicar lançamentos já gerados"
          >
            <RefreshCw size={16} className="mr-1.5" aria-hidden />
            Processar recorrências
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1.5" aria-hidden />
            Nova recorrência
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Ativas"
            value={kpis.ativas}
            sub="templates ativos"
            highlight={kpis.ativas > 0 ? 'blue' : 'neutral'}
          />
          <KpiCard
            label="Vencidas"
            value={kpis.vencidas}
            sub={kpis.vencidas > 0 ? 'aguardando processamento' : 'nenhuma pendente'}
            highlight={kpis.vencidas > 0 ? 'red' : 'neutral'}
          />
          <KpiCard
            label="Receitas este mês"
            value={formatBRL(kpis.receitasMes)}
            sub="a receber via recorrência"
            highlight="green"
            icon={<TrendingUp size={14} />}
          />
          <KpiCard
            label="Despesas este mês"
            value={formatBRL(kpis.despesasMes)}
            sub="a pagar via recorrência"
            highlight="red"
            icon={<TrendingDown size={14} />}
          />
        </div>
      )}

      {/* Alert vencidas */}
      {!loading && kpis.vencidas > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 text-sm text-amber-700 dark:text-amber-300">
            <strong>
              {kpis.vencidas} recorrência{kpis.vencidas !== 1 ? 's' : ''} vencida{kpis.vencidas !== 1 ? 's' : ''}
            </strong>{' '}
            aguardando processamento. Clique em <em>Processar recorrências</em> para gerar os lançamentos.
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && !error && recorrencias.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map(tab => {
            const count = filterCounts[tab.key] ?? 0
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={[
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-400 dark:hover:bg-gray-800/40',
                ].join(' ')}
              >
                {tab.label}
                {count > 0 && (
                  <span className={[
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <RecorrenciasList
        items={filteredAndSorted}
        loading={loading}
        error={error}
        onEdit={(r) => setEditTarget(r)}
        onToggle={handleToggle}
        onNova={() => setCreateOpen(true)}
        activeFilter={activeFilter}
        totalCount={recorrencias.length}
      />

      <RecorrenciaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        contas={contasFinanceiras}
        hasCartoesCredito={hasCartoesCredito}
        categorias={categorias}
        onSuccess={handleCreateSuccess}
      />

      <RecorrenciaModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        contas={contasFinanceiras}
        hasCartoesCredito={hasCartoesCredito}
        categorias={categorias}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
  icon,
}: {
  label: string
  value: string | number
  sub: string
  highlight: 'blue' | 'red' | 'green' | 'neutral'
  icon?: ReactNode
}) {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    neutral: 'text-gray-700 dark:text-gray-200',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#111111]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">{label}</p>
      <div className={`mt-1 flex items-center gap-1.5 text-xl font-bold ${colorMap[highlight]}`}>
        {icon}
        {value}
      </div>
      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600">{sub}</p>
    </div>
  )
}

function RecorrenciasList({
  items,
  loading,
  error,
  onEdit,
  onToggle,
  onNova,
  activeFilter,
  totalCount,
}: {
  items: { recorrencia: RecorrenciaDTO; status: RecorrenciaVisualStatus }[]
  loading: boolean
  error: string | null
  onEdit: (r: RecorrenciaDTO) => void
  onToggle: (r: RecorrenciaDTO) => void
  onNova: () => void
  activeFilter: FilterTab
  totalCount: number
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(item => (
          <Skeleton key={item} className="h-[104px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800/40 dark:bg-red-950/20">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-[#111111]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-accent-blue dark:bg-blue-950/30">
          <Repeat2 size={22} aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          Nenhuma recorrência cadastrada
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Automatize salário, aluguel e contas fixas. Templates geram lançamentos sem duplicar o histórico.
        </p>
        <Button className="mt-5" variant="primary" onClick={onNova}>
          Criar primeira recorrência
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-[#111111]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhuma recorrência com status <strong>{FILTER_TABS.find(t => t.key === activeFilter)?.label}</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(({ recorrencia, status }) => (
        <div
          key={recorrencia.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#111111]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{recorrencia.descricao}</h2>
                <Badge variant={status.variant} size="sm" dot title={status.title}>{status.label}</Badge>
                <Badge variant={recorrencia.tipo === 'income' ? 'success' : 'error'} size="sm">
                  {recorrencia.tipo === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {recorrencia.conta?.nome ?? 'Conta'} · {recorrencia.categoria} · dia {recorrencia.diaVencimento}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                <span>{FREQUENCIA_LABELS[recorrencia.frequencia]}</span>
                <span>Última execução: {recorrencia.ultimaExecucao ? formatShortDate(recorrencia.ultimaExecucao) : 'nunca'}</span>
                <span>Próxima: {recorrencia.proximaExecucao ? formatShortDate(recorrencia.proximaExecucao) : 'sem próxima'}</span>
                {recorrencia.dataFim && (
                  <span>Encerra em: {formatShortDate(recorrencia.dataFim)}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-[140px] text-left sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">Valor</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatBRL(recorrencia.valorCentavos)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(recorrencia)}>
                  Editar
                </Button>
                <Button
                  variant={recorrencia.ativa ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => onToggle(recorrencia)}
                  title={recorrencia.ativa ? 'Pausar sem apagar lançamentos já gerados' : 'Reativar para próximos processamentos'}
                >
                  {recorrencia.ativa ? 'Pausar' : 'Ativar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecorrenciaModal({
  open,
  onOpenChange,
  mode,
  initialData,
  contas,
  hasCartoesCredito,
  categorias,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: RecorrenciaDTO
  contas: ContaDTO[]
  hasCartoesCredito: boolean
  categorias: CategoriaDTO[]
  onSuccess: () => void
}) {
  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar recorrência' : 'Nova recorrência'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize o template; lançamentos já gerados são preservados.'
              : 'Crie um template para gerar lançamentos financeiros recorrentes automáticos.'}
          </DialogDescription>
        </DialogHeader>
        <RecorrenciaForm
          mode={mode}
          initialData={initialData}
          contas={contas}
          hasCartoesCredito={hasCartoesCredito}
          categorias={categorias}
          onSuccess={() => {
            onSuccess()
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function RecorrenciaForm({
  mode,
  initialData,
  contas,
  hasCartoesCredito,
  categorias,
  onSuccess,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initialData?: RecorrenciaDTO
  contas: ContaDTO[]
  hasCartoesCredito: boolean
  categorias: CategoriaDTO[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<RecorrenciaFormState>(() => initialFormState(contas, categorias, initialData))
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValues(initialFormState(contas, categorias, initialData))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [categorias, contas, initialData])

  const proximasOcorrencias = useMemo(
    () => calcularProximasOcorrencias(values),
    [values],
  )

  const handleChange = (field: keyof RecorrenciaFormState, value: string) => {
    setValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError(null)
    setSubmitting(true)

    try {
      const categoriaSelecionada = resolveCategorySelection(categorias, values.categoriaId, values.categoriaManual)
      if (!categoriaSelecionada) {
        setApiError('Informe uma categoria')
        setSubmitting(false)
        return
      }
      const payload: CreateRecorrenciaInput = {
        contaId: values.contaId,
        categoriaId: categoriaSelecionada.categoriaId,
        descricao: values.descricao.trim(),
        tipo: values.tipo,
        categoria: categoriaSelecionada.categoria,
        valorCentavos: toCents(values.valorDisplay.replace(',', '.')),
        frequencia: values.frequencia,
        diaVencimento: Number(values.diaVencimento),
        dataInicio: values.dataInicio,
        dataFim: values.dataFim || null,
      }

      if (mode === 'edit' && initialData) {
        await updateRecorrencia(initialData.id, payload)
      } else {
        await createRecorrencia(payload)
      }

      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar recorrência')
    } finally {
      setSubmitting(false)
    }
  }

  const hasNoContas = contas.length === 0

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {hasCartoesCredito && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Recorrências são para conta corrente, não para cartão de crédito.</p>
            <p className="mt-0.5">
              Se a cobrança acontece todo mês no crédito, use{' '}
              <a href="/dashboard/cartoes/assinaturas" className="inline-flex items-center gap-0.5 font-medium underline">
                Cartões <ArrowRight size={12} /> Assinaturas
              </a>
              .
            </p>
          </div>
        </div>
      )}
      {/* Aviso conta crédito */}
      {hasNoContas && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-medium">Nenhuma conta financeira cadastrada</p>
            <p className="mt-0.5">Recorrências exigem conta corrente, poupança ou dinheiro.</p>
            <p className="mt-1 flex items-center gap-1">
              Para assinaturas no cartão de crédito, acesse
              <a href="/dashboard/cartoes/assinaturas" className="inline-flex items-center gap-0.5 font-medium underline">
                Cartões <ArrowRight size={12} /> Assinaturas
              </a>
            </p>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          Alterações não afetam lançamentos já gerados.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Descrição"
          required
          value={values.descricao}
          onChange={(event) => handleChange('descricao', event.target.value)}
        />
        <Input
          label="Valor (R$)"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={values.valorDisplay}
          onChange={(event) => handleChange('valorDisplay', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Tipo" value={values.tipo} onChange={(value) => {
          setValues(current => ({ ...current, tipo: value as 'income' | 'expense', categoriaId: '', categoriaManual: '' }))
        }}>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </SelectField>

        <SelectField label="Conta" value={values.contaId} onChange={(value) => handleChange('contaId', value)}>
          <option value="">Selecione a conta...</option>
          {contas.map(conta => (
            <option key={conta.id} value={conta.id}>{conta.nome}</option>
          ))}
        </SelectField>
      </div>

      <CategorySelect
        categorias={categorias}
        tipo={values.tipo}
        categoriaId={values.categoriaId}
        categoriaManual={values.categoriaManual}
        onCategoriaIdChange={(id) => setValues(current => ({
          ...current,
          categoriaId: id,
          categoriaManual: id === OUTROS_CATEGORIA ? current.categoriaManual : '',
        }))}
        onCategoriaManualChange={(nome) => setValues(current => ({ ...current, categoriaManual: nome }))}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Frequência" value={values.frequencia} onChange={(value) => handleChange('frequencia', value)}>
          {FREQUENCIAS_RECORRENCIA.map(frequencia => (
            <option key={frequencia} value={frequencia}>{FREQUENCIA_LABELS[frequencia]}</option>
          ))}
        </SelectField>

        <Input
          label="Dia de vencimento"
          required
          type="number"
          min={1}
          max={31}
          value={values.diaVencimento}
          onChange={(event) => handleChange('diaVencimento', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Data de início"
          required
          type="date"
          value={values.dataInicio}
          onChange={(event) => handleChange('dataInicio', event.target.value)}
        />
        <Input
          label="Data de fim (opcional)"
          type="date"
          value={values.dataFim}
          onChange={(event) => handleChange('dataFim', event.target.value)}
        />
      </div>

      {/* Preview próximas ocorrências */}
      {proximasOcorrencias.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/30">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Próximas ocorrências previstas
          </p>
          <div className="flex flex-wrap gap-2">
            {proximasOcorrencias.map((date, i) => (
              <span
                key={i}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-[#1a1a1a] dark:text-gray-300"
              >
                {formatLongDate(date)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
            Valores aproximados — o dia é ajustado quando não existe no mês (ex: dia 31 em fevereiro).
          </p>
        </div>
      )}

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={submitting} loadingText="Salvando..." disabled={hasNoContas}>
          {mode === 'edit' ? 'Atualizar recorrência' : 'Criar recorrência'}
        </Button>
      </div>
    </form>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100"
      >
        {children}
      </select>
    </label>
  )
}

function initialFormState(contas: ContaDTO[], categorias: CategoriaDTO[], initialData?: RecorrenciaDTO): RecorrenciaFormState {
  if (initialData) {
    const categoriaInicial = resolveInitialCategoryValue(
      categorias,
      initialData.categoriaId,
      initialData.categoria,
      initialData.tipo,
    )

    return {
      contaId: initialData.contaId,
      categoriaId: categoriaInicial.categoriaId,
      categoriaManual: categoriaInicial.categoriaManual,
      descricao: initialData.descricao,
      tipo: initialData.tipo,
      valorDisplay: (initialData.valorCentavos / 100).toFixed(2).replace('.', ','),
      frequencia: initialData.frequencia,
      diaVencimento: String(initialData.diaVencimento),
      dataInicio: dateInput(initialData.dataInicio),
      dataFim: initialData.dataFim ? dateInput(initialData.dataFim) : '',
    }
  }

  return {
    contaId: contas[0]?.id ?? '',
    categoriaId: '',
    categoriaManual: '',
    descricao: '',
    tipo: 'expense',
    valorDisplay: '',
    frequencia: 'MENSAL',
    diaVencimento: '10',
    dataInicio: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }),
    dataFim: '',
  }
}

function todayBR(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function dateInput(value: string) {
  return value.slice(0, 10)
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function getRecorrenciaVisualStatus(recorrencia: RecorrenciaDTO): RecorrenciaVisualStatus {
  const hoje = todayBR()

  // Encerrada: dataFim existe e já passou
  if (recorrencia.dataFim && recorrencia.dataFim.slice(0, 10) < hoje) {
    return { label: 'encerrada', variant: 'outline', title: 'Data de término atingida', key: 'encerrada' }
  }

  // Pausada
  if (!recorrencia.ativa) {
    return { label: 'pausada', variant: 'default', title: 'Pausada — não gera novos lançamentos', key: 'pausada' }
  }

  // Futura: dataInicio ainda não chegou
  if (recorrencia.dataInicio.slice(0, 10) > hoje) {
    return { label: 'futura', variant: 'outline', title: 'Início em data futura', key: 'futura' }
  }

  // Vencida: próxima execução está no passado
  if (recorrencia.proximaExecucao && recorrencia.proximaExecucao.slice(0, 10) < hoje) {
    return { label: 'vencida', variant: 'error' as BadgeVariant, title: 'Vencida — aguardando processamento', key: 'vencida' }
  }

  // Vence hoje
  if (recorrencia.proximaExecucao && recorrencia.proximaExecucao.slice(0, 10) === hoje) {
    return { label: 'vence hoje', variant: 'warning', title: 'Vence hoje — processe agora', key: 'vence_hoje' }
  }

  return { label: 'ativa', variant: 'success', title: 'Ativa — aguardando próxima data de execução', key: 'ativa' }
}

const FREQUENCIA_MONTHS: Record<FrequenciaRecorrencia, number> = {
  MENSAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  ANUAL: 12,
}

function calcularProximasOcorrencias(values: RecorrenciaFormState): Date[] {
  const dia = Number(values.diaVencimento)
  if (!dia || dia < 1 || dia > 31 || !values.dataInicio || !values.frequencia) return []

  const intervalMonths = FREQUENCIA_MONTHS[values.frequencia as FrequenciaRecorrencia] ?? 1
  const hoje = new Date(todayBR() + 'T00:00:00Z')
  const inicio = new Date(values.dataInicio + 'T00:00:00Z')
  const fim = values.dataFim ? new Date(values.dataFim + 'T00:00:00Z') : null

  const results: Date[] = []
  let year = inicio.getUTCFullYear()
  let month = inicio.getUTCMonth()

  // Avança até cobrir os próximos 6 meses a partir de hoje
  const limite = new Date(hoje)
  limite.setUTCMonth(limite.getUTCMonth() + 6)

  let safety = 0
  while (results.length < 5 && safety < 60) {
    safety++
    const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const clampedDay = Math.min(dia, maxDay)
    const candidate = new Date(Date.UTC(year, month, clampedDay))

    if (candidate >= inicio && candidate >= hoje) {
      if (!fim || candidate <= fim) {
        results.push(candidate)
      }
    }

    month += intervalMonths
    if (month >= 12) {
      year += Math.floor(month / 12)
      month = month % 12
    }

    if (candidate > limite && results.length >= 3) break
  }

  return results
}
