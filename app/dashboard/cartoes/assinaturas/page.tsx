'use client'

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  CreditCard,
  Plus,
  RefreshCw,
  Zap,
  Pause,
  Play,
  Pencil,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { CategorySelect, OUTROS_CATEGORIA } from '@/components/ui/CategorySelect'
import { resolveCategorySelection, resolveInitialCategoryValue } from '@/lib/categories'
import { formatBRL, toCents } from '@/lib/money'
import { listContas } from '@/features/contas/api'
import { listCategorias } from '@/features/categorias/api'
import type { ContaDTO } from '@/features/contas/types'
import type { CategoriaDTO } from '@/features/categorias/types'
import { CartoesNavTabs } from '@/features/cartao/components/CartoesNavTabs'
import {
  createAssinatura,
  listAssinaturas,
  processarAssinaturas,
  toggleAssinatura,
  updateAssinatura,
} from '@/features/assinaturas/api'
import type {
  AssinaturaCartaoDTO,
  CreateAssinaturaCartaoInput,
} from '@/features/assinaturas/types'

type FormState = {
  contaId: string
  categoriaId: string
  categoriaManual: string
  descricao: string
  valorDisplay: string
  diaCobranca: string
  dataInicio: string
  dataFim: string
}

function todaySP(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function getStatusVisual(a: AssinaturaCartaoDTO) {
  if (!a.ativa) return { label: 'Pausada', variant: 'default' as const }
  if (a.dataFim && a.dataFim < todaySP()) {
    return { label: 'Encerrada', variant: 'outline' as const }
  }
  return { label: 'Ativa', variant: 'success' as const }
}

function formatDateBR(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export default function AssinaturasCartaoPage() {
  const { toast } = useToast()
  const [assinaturas, setAssinaturas] = useState<AssinaturaCartaoDTO[]>([])
  const [contas, setContas] = useState<ContaDTO[]>([])
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssinaturaCartaoDTO | null>(null)
  const [processing, setProcessing] = useState(false)

  const cartoesCredito = useMemo(
    () => contas.filter(c => c.tipo === 'credit' && c.ativa),
    [contas],
  )

  const kpis = useMemo(() => {
    const hoje = todaySP()
    const ativas = assinaturas.filter(a => a.ativa && (!a.dataFim || a.dataFim >= hoje))
    const totalMensal = ativas.reduce((s, a) => s + a.valorCentavos, 0)
    const vencidasParaProcessar = assinaturas.filter(
      a => a.ativa && a.proximaCobranca && a.proximaCobranca.slice(0, 10) <= hoje,
    )
    return {
      total: assinaturas.length,
      ativas: ativas.length,
      totalMensal,
      vencidasParaProcessar: vencidasParaProcessar.length,
    }
  }, [assinaturas])

  const loadBase = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      listAssinaturas(),
      listContas(),
      listCategorias({ includeInactive: false }),
    ])
      .then(([ass, conts, cats]) => {
        setAssinaturas(ass)
        setContas(conts)
        setCategorias(cats)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadBase()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBase])

  const handleToggle = useCallback(async (a: AssinaturaCartaoDTO) => {
    try {
      await toggleAssinatura(a.id)
      loadBase()
      toast({ type: 'success', title: a.ativa ? 'Assinatura pausada' : 'Assinatura reativada' })
    } catch (e) {
      toast({ type: 'error', title: 'Erro', description: e instanceof Error ? e.message : 'Tente novamente.' })
    }
  }, [loadBase, toast])

  const handleProcessar = useCallback(async () => {
    setProcessing(true)
    try {
      const result = await processarAssinaturas()
      loadBase()
      toast({
        type: 'success',
        title: result.comprasCriadas > 0 ? `${result.comprasCriadas} cobrança(s) gerada(s)` : 'Tudo em dia',
        description: `${result.assinaturasProcessadas} assinaturas verificadas.`,
      })
    } catch (e) {
      toast({ type: 'error', title: 'Erro ao processar', description: e instanceof Error ? e.message : 'Tente novamente.' })
    } finally {
      setProcessing(false)
    }
  }, [loadBase, toast])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assinaturas no Cartão</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Cobranças recorrentes no crédito — Netflix, Spotify, academia e similares
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={handleProcessar} isLoading={processing} loadingText="Gerando...">
            <RefreshCw size={15} className="mr-1.5" aria-hidden />
            Gerar cobranças
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} className="mr-1.5" aria-hidden />
            Nova assinatura
          </Button>
        </div>
      </div>

      <CartoesNavTabs />

      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total cadastradas" value={String(kpis.total)} />
          <KpiCard label="Ativas" value={String(kpis.ativas)} highlight />
          <KpiCard label="Custo mensal" value={formatBRL(kpis.totalMensal)} />
          <KpiCard
            label="Para processar"
            value={String(kpis.vencidasParaProcessar)}
            alert={kpis.vencidasParaProcessar > 0}
          />
        </div>
      )}

      {!loading && cartoesCredito.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-semibold">Nenhum cartão de crédito cadastrado.</p>
            <p className="mt-0.5 text-xs">
              Cadastre um <strong>cartão de crédito</strong> com dia de fechamento e vencimento em{' '}
              <Link href="/dashboard/contas" className="underline">Contas</Link> antes de criar assinaturas.
            </p>
          </div>
        </div>
      )}

      <AssinaturasList
        assinaturas={assinaturas}
        loading={loading}
        error={error}
        onEdit={setEditTarget}
        onToggle={handleToggle}
        onNova={() => setCreateOpen(true)}
      />

      <AssinaturaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        cartoes={cartoesCredito}
        categorias={categorias}
        onSuccess={() => {
          setCreateOpen(false)
          loadBase()
          toast({ type: 'success', title: 'Assinatura criada' })
        }}
      />
      <AssinaturaModal
        open={!!editTarget}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        cartoes={cartoesCredito}
        categorias={categorias}
        onSuccess={() => {
          setEditTarget(null)
          loadBase()
          toast({ type: 'success', title: 'Assinatura atualizada' })
        }}
      />
    </div>
  )
}

function KpiCard({ label, value, highlight, alert }: { label: string; value: string; highlight?: boolean; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${
      alert
        ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
        : 'border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#1C1C1C]'
    }`}>
      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${
        highlight ? 'text-blue-600 dark:text-blue-400' : alert ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'
      }`}>
        {value}
      </p>
    </div>
  )
}

function AssinaturasList({
  assinaturas, loading, error, onEdit, onToggle, onNova,
}: {
  assinaturas: AssinaturaCartaoDTO[]
  loading: boolean
  error: string | null
  onEdit: (a: AssinaturaCartaoDTO) => void
  onToggle: (a: AssinaturaCartaoDTO) => void
  onNova: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[96px] w-full rounded-xl" />)}
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

  if (assinaturas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-[#111111]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
          <CreditCard size={22} className="text-blue-500" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          Nenhuma assinatura cadastrada.
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Registre Netflix, Spotify, academia e qualquer serviço cobrado no seu cartão.
        </p>
        <Button className="mt-5" variant="primary" onClick={onNova}>
          <Plus size={14} className="mr-1.5" />
          Criar assinatura
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {assinaturas.map(a => {
        const status = getStatusVisual(a)
        return (
          <div
            key={a.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#111111]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={14} className="shrink-0 text-blue-500" aria-hidden />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">{a.descricao}</h2>
                  </div>
                  <Badge variant={status.variant} size="sm" dot>{status.label}</Badge>
                  <Badge variant="outline" size="sm">{a.categoria}</Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {a.conta?.nome ?? 'Cartão'} · dia {a.diaCobranca} de cada mês
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>Próxima cobrança: {formatDateBR(a.proximaCobranca)}</span>
                  <span>Última: {formatDateBR(a.ultimaCobranca)}</span>
                  {a.dataFim && <span>Encerra em: {a.dataFim.slice(0, 10)}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-[120px] text-left sm:text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">Mensal</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatBRL(a.valorCentavos)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(a)}>
                    <Pencil size={13} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={a.ativa ? 'ghost' : 'primary'}
                    size="sm"
                    onClick={() => onToggle(a)}
                    title={a.ativa ? 'Pausar sem apagar histórico' : 'Reativar assinatura'}
                  >
                    {a.ativa ? <Pause size={13} className="mr-1" /> : <Play size={13} className="mr-1" />}
                    {a.ativa ? 'Pausar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AssinaturaModal({
  open, onOpenChange, mode, initialData, cartoes, categorias, onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: AssinaturaCartaoDTO
  cartoes: ContaDTO[]
  categorias: CategoriaDTO[]
  onSuccess: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar assinatura' : 'Nova assinatura no cartão'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Atualize os dados. Cobranças já geradas são preservadas.'
              : 'Assinaturas entram na fatura do cartão de crédito conforme o dia de cobrança.'}
          </DialogDescription>
        </DialogHeader>
        <AssinaturaForm
          mode={mode}
          initialData={initialData}
          cartoes={cartoes}
          categorias={categorias}
          onSuccess={() => { onSuccess(); onOpenChange(false) }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function AssinaturaForm({
  mode, initialData, cartoes, categorias, onSuccess, onCancel,
}: {
  mode: 'create' | 'edit'
  initialData?: AssinaturaCartaoDTO
  cartoes: ContaDTO[]
  categorias: CategoriaDTO[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<FormState>(() => buildInitialState(cartoes, categorias, initialData))
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValues(buildInitialState(cartoes, categorias, initialData))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [cartoes, categorias, initialData])

  const set = (field: keyof FormState, value: string) =>
    setValues(cur => ({ ...cur, [field]: value }))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError(null)
    setSubmitting(true)
    try {
      const categoriaSelecionada = resolveCategorySelection(categorias, values.categoriaId, values.categoriaManual)
      if (!categoriaSelecionada) {
        setApiError('Informe uma categoria.')
        setSubmitting(false)
        return
      }

      const payload: CreateAssinaturaCartaoInput = {
        contaId: values.contaId,
        categoriaId: categoriaSelecionada.categoriaId,
        descricao: values.descricao.trim(),
        categoria: categoriaSelecionada.categoria,
        valorCentavos: toCents(values.valorDisplay.replace(',', '.')),
        diaCobranca: Number(values.diaCobranca),
        dataInicio: values.dataInicio,
        dataFim: values.dataFim || null,
      }

      if (mode === 'edit' && initialData) {
        await updateAssinatura(initialData.id, payload)
      } else {
        await createAssinatura(payload)
      }
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {mode === 'edit' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          Alterações não afetam cobranças já geradas na fatura.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Descrição"
          required
          placeholder="Ex: Netflix, Spotify, Academia..."
          value={values.descricao}
          onChange={e => set('descricao', e.target.value)}
        />
        <Input
          label="Valor mensal (R$)"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={values.valorDisplay}
          onChange={e => set('valorDisplay', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <SelectField
          label="Cartão de crédito"
          value={values.contaId}
          onChange={v => set('contaId', v)}
          disabled={mode === 'edit'}
        >
          <option value="">Selecione o cartão...</option>
          {cartoes.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </SelectField>
      </div>

      <CategorySelect
        categorias={categorias}
        tipo="expense"
        categoriaId={values.categoriaId}
        categoriaManual={values.categoriaManual}
        onCategoriaIdChange={id => {
          setValues(cur => ({
            ...cur,
            categoriaId: id,
            categoriaManual: id === OUTROS_CATEGORIA ? cur.categoriaManual : '',
          }))
        }}
        onCategoriaManualChange={nome => set('categoriaManual', nome)}
        label="Categoria"
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Dia de cobrança"
          required
          type="number"
          min={1}
          max={31}
          value={values.diaCobranca}
          onChange={e => set('diaCobranca', e.target.value)}
        />
        <Input
          label="Início"
          required
          type="date"
          value={values.dataInicio}
          onChange={e => set('dataInicio', e.target.value)}
        />
        <Input
          label="Fim (opcional)"
          type="date"
          value={values.dataFim}
          onChange={e => set('dataFim', e.target.value)}
        />
      </div>

      {cartoes.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          Nenhum cartão de crédito disponível. Cadastre um em{' '}
          <Link href="/dashboard/contas" className="font-semibold underline">Contas</Link>.
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
        <Button
          type="submit"
          variant="primary"
          isLoading={submitting}
          loadingText="Salvando..."
          disabled={cartoes.length === 0}
        >
          <Zap size={14} className="mr-1.5" />
          {mode === 'edit' ? 'Atualizar' : 'Criar assinatura'}
        </Button>
      </div>
    </form>
  )
}

function SelectField({
  label, value, onChange, children, disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-[#1E1E1E] dark:text-gray-100 disabled:opacity-50"
      >
        {children}
      </select>
    </label>
  )
}

function buildInitialState(cartoes: ContaDTO[], categorias: CategoriaDTO[], data?: AssinaturaCartaoDTO): FormState {
  if (data) {
    const categoriaInicial = resolveInitialCategoryValue(
      categorias,
      data.categoriaId,
      data.categoria,
      'expense',
    )

    return {
      contaId: data.contaId,
      // Se não tem categoriaId no banco, usa "Outros" para mostrar o campo manual
      categoriaId: categoriaInicial.categoriaId,
      categoriaManual: categoriaInicial.categoriaManual,
      descricao: data.descricao,
      valorDisplay: (data.valorCentavos / 100).toFixed(2).replace('.', ','),
      diaCobranca: String(data.diaCobranca),
      dataInicio: data.dataInicio.slice(0, 10),
      dataFim: data.dataFim ? data.dataFim.slice(0, 10) : '',
    }
  }

  return {
    contaId: cartoes[0]?.id ?? '',
    categoriaId: '',
    categoriaManual: '',
    descricao: '',
    valorDisplay: '',
    diaCobranca: '10',
    dataInicio: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }),
    dataFim: '',
  }
}
