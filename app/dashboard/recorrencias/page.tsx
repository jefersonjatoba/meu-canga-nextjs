'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Repeat2, RefreshCw } from 'lucide-react'
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
import type { TipoLancamento } from '@/features/lancamentos/types'

const MANUAL_CATEGORY = '__manual__'

type RecorrenciaFormState = {
  contaId: string
  categoriaId: string
  descricao: string
  tipo: 'income' | 'expense'
  categoria: string
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

  const contasFinanceiras = useMemo(
    () => contas.filter(conta => conta.tipo !== 'credit' && conta.ativa),
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
        setError(e instanceof Error ? e.message : 'Erro ao carregar recorrencias')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadBase()
  }, [loadBase])

  const handleCreateSuccess = useCallback(() => {
    setCreateOpen(false)
    loadBase()
    toast({
      type: 'success',
      title: 'Recorrencia criada',
      description: 'O template financeiro foi salvo com sucesso.',
    })
  }, [loadBase, toast])

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null)
    loadBase()
    toast({
      type: 'success',
      title: 'Recorrencia atualizada',
      description: 'As alteracoes foram salvas.',
    })
  }, [loadBase, toast])

  const handleToggle = useCallback(async (recorrencia: RecorrenciaDTO) => {
    try {
      await toggleRecorrencia(recorrencia.id)
      loadBase()
      toast({
        type: 'success',
        title: recorrencia.ativa ? 'Recorrencia pausada' : 'Recorrencia reativada',
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao atualizar recorrencia',
        description: e instanceof Error ? e.message : 'Nao foi possivel atualizar a recorrencia.',
      })
    }
  }, [loadBase, toast])

  const handleProcessar = useCallback(async () => {
    setProcessing(true)
    try {
      const result = await processarRecorrencias()
      loadBase()
      toast({
        type: 'success',
        title: 'Recorrencias processadas',
        description: `${result.lancamentosCriados} lancamento${result.lancamentosCriados !== 1 ? 's' : ''} criado${result.lancamentosCriados !== 1 ? 's' : ''}.`,
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao processar recorrencias',
        description: e instanceof Error ? e.message : 'Nao foi possivel processar agora.',
      })
    } finally {
      setProcessing(false)
    }
  }, [loadBase, toast])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recorrencias</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {recorrencias.length === 0
              ? 'Nenhuma recorrencia cadastrada'
              : `${recorrencias.length} recorrencia${recorrencias.length !== 1 ? 's' : ''} financeira${recorrencias.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleProcessar} isLoading={processing} loadingText="Processando...">
            <RefreshCw size={16} className="mr-1.5" aria-hidden />
            Processar recorrencias
          </Button>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1.5" aria-hidden />
            Nova recorrencia
          </Button>
        </div>
      </div>

      <RecorrenciasList
        recorrencias={recorrencias}
        loading={loading}
        error={error}
        onEdit={setEditTarget}
        onToggle={handleToggle}
        onNova={() => setCreateOpen(true)}
      />

      <RecorrenciaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        contas={contasFinanceiras}
        categorias={categorias}
        onSuccess={handleCreateSuccess}
      />

      <RecorrenciaModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        contas={contasFinanceiras}
        categorias={categorias}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}

function RecorrenciasList({
  recorrencias,
  loading,
  error,
  onEdit,
  onToggle,
  onNova,
}: {
  recorrencias: RecorrenciaDTO[]
  loading: boolean
  error: string | null
  onEdit: (recorrencia: RecorrenciaDTO) => void
  onToggle: (recorrencia: RecorrenciaDTO) => void
  onNova: () => void
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(item => (
          <Skeleton key={item} className="h-[92px] w-full rounded-xl" />
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

  if (recorrencias.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-[#111111]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-accent-blue dark:bg-blue-950/30">
          <Repeat2 size={22} aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          Automatize contas fixas
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Crie recorrencias para gerar lancamentos mensais sem duplicar o financeiro.
        </p>
        <Button className="mt-5" variant="primary" onClick={onNova}>
          Nova recorrencia
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recorrencias.map(recorrencia => (
        <div
          key={recorrencia.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-[#111111]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {recorrencia.descricao}
                </h2>
                <Badge variant={recorrencia.ativa ? 'success' : 'default'} size="sm">
                  {recorrencia.ativa ? 'ativa' : 'pausada'}
                </Badge>
                <Badge variant="outline" size="sm">
                  {recorrencia.tipo === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {recorrencia.conta?.nome ?? 'Conta'} - {recorrencia.categoria} - dia {recorrencia.diaVencimento}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {FREQUENCIA_LABELS[recorrencia.frequencia]} · próxima: {recorrencia.proximaExecucao ? formatDate(recorrencia.proximaExecucao) : 'sem próxima execução'}
              </p>
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
                <Button variant={recorrencia.ativa ? 'ghost' : 'primary'} size="sm" onClick={() => onToggle(recorrencia)}>
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
  categorias,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: RecorrenciaDTO
  contas: ContaDTO[]
  categorias: CategoriaDTO[]
  onSuccess: () => void
}) {
  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar recorrencia' : 'Nova recorrencia'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize o template; lancamentos ja gerados serao preservados.'
              : 'Crie um template para gerar lancamentos financeiros recorrentes.'}
          </DialogDescription>
        </DialogHeader>
        <RecorrenciaForm
          mode={mode}
          initialData={initialData}
          contas={contas}
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
  categorias,
  onSuccess,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initialData?: RecorrenciaDTO
  contas: ContaDTO[]
  categorias: CategoriaDTO[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<RecorrenciaFormState>(() => initialFormState(contas, initialData))
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues(initialFormState(contas, initialData))
  }, [contas, initialData])

  const categoriasFiltradas = categorias.filter(
    categoria => categoria.tipo === values.tipo || categoria.tipo === 'both',
  )
  const showManualCategoria = values.categoriaId === MANUAL_CATEGORY || categoriasFiltradas.length === 0

  const handleChange = (field: keyof RecorrenciaFormState, value: string) => {
    setValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError(null)
    setSubmitting(true)

    try {
      const categoriaSelecionada = categorias.find(categoria => categoria.id === values.categoriaId)
      const categoriaId = categoriaSelecionada?.id ?? (values.categoriaId === MANUAL_CATEGORY ? null : undefined)
      const payload: CreateRecorrenciaInput = {
        contaId: values.contaId,
        categoriaId,
        descricao: values.descricao.trim(),
        tipo: values.tipo,
        categoria: categoriaSelecionada?.nome ?? values.categoria.trim(),
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
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar recorrencia')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Descricao"
          required
          value={values.descricao}
          onChange={(event) => handleChange('descricao', event.target.value)}
        />
        <Input
          label="Valor"
          required
          inputMode="decimal"
          value={values.valorDisplay}
          onChange={(event) => handleChange('valorDisplay', event.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Tipo" value={values.tipo} onChange={(value) => {
          setValues(current => ({ ...current, tipo: value as 'income' | 'expense', categoriaId: '', categoria: '' }))
        }}>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
        </SelectField>

        <SelectField label="Conta" value={values.contaId} onChange={(value) => handleChange('contaId', value)}>
          <option value="">Selecione...</option>
          {contas.map(conta => (
            <option key={conta.id} value={conta.id}>{conta.nome}</option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Categoria"
          value={values.categoriaId}
          onChange={(value) => {
            const selected = categorias.find(categoria => categoria.id === value)
            setValues(current => ({
              ...current,
              categoriaId: value,
              categoria: selected?.nome ?? (value === MANUAL_CATEGORY ? current.categoria : ''),
            }))
          }}
        >
          <option value="">Selecione...</option>
          {categoriasFiltradas.map(categoria => (
            <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
          ))}
          <option value={MANUAL_CATEGORY}>Categoria manual</option>
        </SelectField>

        <SelectField label="Frequencia" value={values.frequencia} onChange={(value) => handleChange('frequencia', value)}>
          {FREQUENCIAS_RECORRENCIA.map(frequencia => (
            <option key={frequencia} value={frequencia}>{FREQUENCIA_LABELS[frequencia]}</option>
          ))}
        </SelectField>
      </div>

      {showManualCategoria && (
        <Input
          label="Categoria manual"
          required
          value={values.categoria}
          onChange={(event) => handleChange('categoria', event.target.value)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Dia de vencimento"
          required
          type="number"
          min={1}
          max={31}
          value={values.diaVencimento}
          onChange={(event) => handleChange('diaVencimento', event.target.value)}
        />
        <Input
          label="Inicio"
          required
          type="date"
          value={values.dataInicio}
          onChange={(event) => handleChange('dataInicio', event.target.value)}
        />
        <Input
          label="Fim"
          type="date"
          value={values.dataFim}
          onChange={(event) => handleChange('dataFim', event.target.value)}
        />
      </div>

      {contas.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          Cadastre uma conta que nao seja cartao de credito para criar recorrencias.
        </p>
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
        <Button type="submit" variant="primary" isLoading={submitting} loadingText="Salvando..." disabled={contas.length === 0}>
          {mode === 'edit' ? 'Atualizar recorrencia' : 'Criar recorrencia'}
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
  children: React.ReactNode
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

function initialFormState(contas: ContaDTO[], initialData?: RecorrenciaDTO): RecorrenciaFormState {
  if (initialData) {
    return {
      contaId: initialData.contaId,
      categoriaId: initialData.categoriaId ?? MANUAL_CATEGORY,
      descricao: initialData.descricao,
      tipo: initialData.tipo,
      categoria: initialData.categoria,
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
    descricao: '',
    tipo: 'expense',
    categoria: '',
    valorDisplay: '',
    frequencia: 'MENSAL',
    diaVencimento: '10',
    dataInicio: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }),
    dataFim: '',
  }
}

function dateInput(value: string) {
  return value.slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}
