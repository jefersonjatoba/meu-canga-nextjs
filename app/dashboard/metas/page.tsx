'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, PiggyBank, Plus, Target } from 'lucide-react'
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
import { MoneyInput } from '@/features/lancamentos/components/MoneyInput'
import { formatBRL, toCents } from '@/lib/money'
import { listContas } from '@/features/contas/api'
import type { ContaDTO } from '@/features/contas/types'
import {
  cancelarAporte,
  createMeta,
  listMetas,
  registrarAporte,
  toggleMeta,
  updateMeta,
} from '@/features/metas/api'
import {
  TIPO_META_LABELS,
  TIPOS_META,
  type CreateMetaInput,
  type MetaDTO,
  type RegistrarMetaAporteInput,
  type TipoMeta,
} from '@/features/metas/types'

type MetaFormState = {
  descricao: string
  tipo: TipoMeta
  valorAlvo: string
  valorInicial: string
  dataInicio: string
  dataAlvo: string
  cor: string
}

type AporteFormState = {
  contaId: string
  valor: string
  dataAporte: string
  descricao: string
}

type CancelAporteTarget = {
  meta: MetaDTO
  aporteId: string
}

export default function MetasPage() {
  const { toast } = useToast()
  const [metas, setMetas] = useState<MetaDTO[]>([])
  const [contas, setContas] = useState<ContaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<MetaDTO | null>(null)
  const [aporteTarget, setAporteTarget] = useState<MetaDTO | null>(null)
  const [cancelAporteTarget, setCancelAporteTarget] = useState<CancelAporteTarget | null>(null)

  const contasAporte = useMemo(
    () => contas.filter(conta => conta.ativa && conta.tipo !== 'credit'),
    [contas],
  )

  const loadBase = useCallback(() => {
    setLoading(true)
    setError(null)

    Promise.all([listMetas(), listContas()])
      .then(([metasResult, contasResult]) => {
        setMetas(metasResult)
        setContas(contasResult)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar metas')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadBase()
  }, [loadBase])

  const handleToggle = useCallback(async (meta: MetaDTO) => {
    try {
      await toggleMeta(meta.id)
      loadBase()
      toast({
        type: 'success',
        title: meta.status === 'ativa' ? 'Meta pausada' : 'Meta reativada',
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao atualizar meta',
        description: e instanceof Error ? e.message : 'Nao foi possivel atualizar a meta.',
      })
    }
  }, [loadBase, toast])

  const handleConfirmCancelAporte = useCallback(async () => {
    if (!cancelAporteTarget) return
    try {
      await cancelarAporte(cancelAporteTarget.meta.id, cancelAporteTarget.aporteId)
      setCancelAporteTarget(null)
      loadBase()
      toast({
        type: 'success',
        title: 'Aporte cancelado',
        description: 'O progresso da meta foi recalculado.',
      })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao cancelar aporte',
        description: e instanceof Error ? e.message : 'Nao foi possivel cancelar o aporte.',
      })
    }
  }, [cancelAporteTarget, loadBase, toast])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Metas financeiras</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Acompanhe reserva, viagem, estudo ou objetivo pessoal por aportes.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-1.5" aria-hidden />
          Nova meta
        </Button>
      </div>

      <MetasList
        metas={metas}
        loading={loading}
        error={error}
        onNova={() => setCreateOpen(true)}
        onEdit={setEditTarget}
        onAporte={setAporteTarget}
        onToggle={handleToggle}
        onCancelAporte={(meta, aporteId) => setCancelAporteTarget({ meta, aporteId })}
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
        Metas sao controles de planejamento. Elas nao alteram automaticamente seu saldo financeiro.
      </div>

      <MetaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={() => {
          setCreateOpen(false)
          loadBase()
          toast({ type: 'success', title: 'Meta criada' })
        }}
      />

      <MetaModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        onSuccess={() => {
          setEditTarget(null)
          loadBase()
          toast({ type: 'success', title: 'Meta atualizada' })
        }}
      />

      <AporteModal
        open={!!aporteTarget}
        onOpenChange={(open) => { if (!open) setAporteTarget(null) }}
        meta={aporteTarget}
        contas={contasAporte}
        onSuccess={() => {
          setAporteTarget(null)
          loadBase()
          toast({
            type: 'success',
            title: 'Aporte registrado',
            description: 'O progresso da meta foi atualizado sem alterar o saldo.',
          })
        }}
      />

      <CancelAporteModal
        target={cancelAporteTarget}
        onOpenChange={(open) => { if (!open) setCancelAporteTarget(null) }}
        onConfirm={handleConfirmCancelAporte}
      />
    </div>
  )
}

function MetasList({
  metas,
  loading,
  error,
  onNova,
  onEdit,
  onAporte,
  onToggle,
  onCancelAporte,
}: {
  metas: MetaDTO[]
  loading: boolean
  error: string | null
  onNova: () => void
  onEdit: (meta: MetaDTO) => void
  onAporte: (meta: MetaDTO) => void
  onToggle: (meta: MetaDTO) => void
  onCancelAporte: (meta: MetaDTO, aporteId: string) => void
}) {
  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {[1, 2, 3, 4].map(item => (
          <Skeleton key={item} className="h-[220px] rounded-xl" />
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

  if (metas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-700 dark:bg-[#111111]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-accent-blue dark:bg-blue-950/30">
          <Target size={22} aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
          Voce ainda nao criou nenhuma meta financeira.
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Use metas para acompanhar reserva de emergencia, viagem, estudo ou objetivo pessoal.
        </p>
        <Button className="mt-5" variant="primary" onClick={onNova}>
          Criar meta
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {metas.map(meta => (
        <MetaCard
          key={meta.id}
          meta={meta}
          onEdit={() => onEdit(meta)}
          onAporte={() => onAporte(meta)}
          onToggle={() => onToggle(meta)}
          onCancelAporte={(aporteId) => onCancelAporte(meta, aporteId)}
        />
      ))}
    </div>
  )
}

function MetaCard({
  meta,
  onEdit,
  onAporte,
  onToggle,
  onCancelAporte,
}: {
  meta: MetaDTO
  onEdit: () => void
  onAporte: () => void
  onToggle: () => void
  onCancelAporte: (aporteId: string) => void
}) {
  const progress = Math.min(100, meta.progresso.percentual)
  const status = getMetaStatus(meta)
  const confirmados = meta.aportes.filter(aporte => aporte.status === 'confirmado')
  const cancelados = meta.aportes.filter(aporte => aporte.status === 'cancelado')
  const metaSuperada = meta.progresso.progressoCentavos > meta.valorAlvoCentavos

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111111]">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: meta.cor ?? '#2563eb' }}
        aria-hidden
      />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
                {meta.descricao}
              </h2>
              <Badge variant={status.variant} size="sm" dot>
                {status.label}
              </Badge>
              <Badge variant="outline" size="sm">
                {TIPO_META_LABELS[meta.tipo]}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Inicio {formatShortDate(meta.dataInicio)}
              {meta.dataAlvo ? ` - alvo ${formatShortDate(meta.dataAlvo)}` : ''}
            </p>
          </div>
          <div className={status.iconClassName}>
            {meta.status === 'concluida' ? <CheckCircle2 size={19} aria-hidden /> : <PiggyBank size={19} aria-hidden />}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">Progresso</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatBRL(meta.progresso.progressoCentavos)}
              </p>
              {metaSuperada && (
                <p className="mt-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  Meta superada
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500">Valor alvo</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {formatBRL(meta.valorAlvoCentavos)}
              </p>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={status.progressClassName}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{meta.progresso.percentual.toFixed(1)}% concluido</span>
            <span>{metaSuperada ? 'Objetivo ultrapassado' : `Faltam ${formatBRL(meta.progresso.valorRestanteCentavos)}`}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-900/40">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Valor inicial</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {formatBRL(meta.valorInicialCentavos)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Aportes</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {formatBRL(meta.progresso.aportesConfirmadosCentavos)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
              Historico de aportes
            </p>
            {cancelados.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {cancelados.length} cancelado{cancelados.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {meta.aportes.length > 0 ? (
            <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
              {meta.aportes.slice(0, 5).map(aporte => (
                <div
                  key={aporte.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-[#111111]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {formatBRL(aporte.valorCentavos)}
                      </p>
                      <Badge variant={aporte.status === 'confirmado' ? 'success' : 'default'} size="sm">
                        {aporte.status === 'confirmado' ? 'confirmado' : 'cancelado'}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500">
                      <span>{formatShortDate(aporte.dataAporte)}</span>
                      {aporte.conta && <span>{aporte.conta.nome}</span>}
                      {aporte.descricao && <span className="truncate">{aporte.descricao}</span>}
                    </div>
                  </div>
                  {aporte.status === 'confirmado' && (
                    <Button variant="ghost" size="xs" onClick={() => onCancelAporte(aporte.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Nenhum aporte registrado ainda.
            </p>
          )}
          {confirmados.length + cancelados.length > 5 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Mostrando os 5 aportes mais recentes.</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Editar
          </Button>
          {meta.status !== 'concluida' && meta.status !== 'cancelada' && (
            <Button variant={meta.status === 'ativa' ? 'ghost' : 'primary'} size="sm" onClick={onToggle}>
              {meta.status === 'ativa' ? 'Pausar' : 'Ativar'}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onAporte} disabled={meta.status === 'cancelada'}>
            Registrar aporte
          </Button>
        </div>
      </div>
    </article>
  )
}

function MetaModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialData?: MetaDTO
  onSuccess: () => void
}) {
  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar meta' : 'Nova meta'}</DialogTitle>
          <DialogDescription>
            Metas registram progresso por aportes e nao alteram saldo nem criam lancamentos.
          </DialogDescription>
        </DialogHeader>
        <MetaForm
          mode={mode}
          initialData={initialData}
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

function MetaForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initialData?: MetaDTO
  onSuccess: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<MetaFormState>(() => initialMetaFormState(initialData))
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues(initialMetaFormState(initialData))
  }, [initialData])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError(null)
    setSubmitting(true)

    try {
      const payload: CreateMetaInput = {
        descricao: values.descricao.trim(),
        tipo: values.tipo,
        valorAlvoCentavos: toCents(values.valorAlvo),
        valorInicialCentavos: values.valorInicial ? toCents(values.valorInicial) : 0,
        dataInicio: values.dataInicio,
        dataAlvo: values.dataAlvo || null,
        cor: values.cor || null,
      }

      if (mode === 'edit' && initialData) {
        await updateMeta(initialData.id, payload)
      } else {
        await createMeta(payload)
      }

      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao salvar meta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Descricao"
          required
          value={values.descricao}
          onChange={(event) => setValues(current => ({ ...current, descricao: event.target.value }))}
        />
        <SelectField
          label="Tipo"
          value={values.tipo}
          onChange={(value) => setValues(current => ({ ...current, tipo: value as TipoMeta }))}
        >
          {TIPOS_META.map(tipo => (
            <option key={tipo} value={tipo}>{TIPO_META_LABELS[tipo]}</option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyInput
          label="Valor alvo"
          required
          value={values.valorAlvo}
          onChange={(value) => setValues(current => ({ ...current, valorAlvo: value }))}
        />
        <MoneyInput
          label="Valor inicial"
          value={values.valorInicial}
          onChange={(value) => setValues(current => ({ ...current, valorInicial: value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Inicio"
          type="date"
          required
          value={values.dataInicio}
          onChange={(event) => setValues(current => ({ ...current, dataInicio: event.target.value }))}
        />
        <Input
          label="Data alvo"
          type="date"
          value={values.dataAlvo}
          onChange={(event) => setValues(current => ({ ...current, dataAlvo: event.target.value }))}
        />
        <Input
          label="Cor"
          type="color"
          value={values.cor}
          onChange={(event) => setValues(current => ({ ...current, cor: event.target.value }))}
        />
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={submitting} loadingText="Salvando...">
          {mode === 'edit' ? 'Atualizar meta' : 'Criar meta'}
        </Button>
      </div>
    </form>
  )
}

function AporteModal({
  open,
  onOpenChange,
  meta,
  contas,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: MetaDTO | null
  contas: ContaDTO[]
  onSuccess: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
          <DialogDescription>
            Este aporte atualiza o progresso da meta, mas nao movimenta saldo bancario.
          </DialogDescription>
        </DialogHeader>
        {meta && (
          <AporteForm
            meta={meta}
            contas={contas}
            onSuccess={() => {
              onSuccess()
              onOpenChange(false)
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CancelAporteModal({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: CancelAporteTarget | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const aporte = target?.meta.aportes.find(item => item.id === target.aporteId)

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Cancelar aporte?</DialogTitle>
          <DialogDescription>
            Esta acao nao apaga dados. O historico sera preservado e o progresso da meta sera recalculado.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                <p>
                  O aporte sera marcado como cancelado. Ele deixa de contar no progresso, mas permanece visivel no historico.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {target.meta.descricao}
              </p>
              {aporte && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatBRL(aporte.valorCentavos)} em {formatShortDate(aporte.dataAporte)}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Voltar
              </Button>
              <Button type="button" variant="danger" onClick={onConfirm}>
                Cancelar aporte
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AporteForm({
  meta,
  contas,
  onSuccess,
  onCancel,
}: {
  meta: MetaDTO
  contas: ContaDTO[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<AporteFormState>(() => ({
    contaId: '',
    valor: '',
    dataAporte: todayInput(),
    descricao: '',
  }))
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError(null)
    setSubmitting(true)

    try {
      const valorCentavos = toCents(values.valor)
      if (valorCentavos <= 0) {
        throw new Error('Valor do aporte deve ser maior que zero.')
      }

      const payload: RegistrarMetaAporteInput = {
        contaId: values.contaId || null,
        valorCentavos,
        dataAporte: values.dataAporte,
        descricao: values.descricao.trim() || null,
      }

      await registrarAporte(meta.id, payload)
      onSuccess()
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erro ao registrar aporte')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-900/40">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{meta.descricao}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Faltam {formatBRL(meta.progresso.valorRestanteCentavos)}
        </p>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
        Este aporte atualiza o progresso da meta, mas nao movimenta saldo bancario.
      </div>

      <MoneyInput
        label="Valor do aporte"
        required
        value={values.valor}
        onChange={(value) => setValues(current => ({ ...current, valor: value }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Data"
          type="date"
          required
          value={values.dataAporte}
          onChange={(event) => setValues(current => ({ ...current, dataAporte: event.target.value }))}
        />
        <SelectField
          label="Conta de referencia"
          value={values.contaId}
          onChange={(value) => setValues(current => ({ ...current, contaId: value }))}
        >
          <option value="">Sem conta</option>
          {contas.map(conta => (
            <option key={conta.id} value={conta.id}>{conta.nome}</option>
          ))}
        </SelectField>
      </div>

      <Input
        label="Descricao"
        value={values.descricao}
        onChange={(event) => setValues(current => ({ ...current, descricao: event.target.value }))}
      />

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={submitting} loadingText="Registrando...">
          Registrar aporte
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

function initialMetaFormState(meta?: MetaDTO): MetaFormState {
  if (meta) {
    return {
      descricao: meta.descricao,
      tipo: meta.tipo,
      valorAlvo: centsToDisplay(meta.valorAlvoCentavos),
      valorInicial: centsToDisplay(meta.valorInicialCentavos),
      dataInicio: dateInput(meta.dataInicio),
      dataAlvo: meta.dataAlvo ? dateInput(meta.dataAlvo) : '',
      cor: meta.cor ?? '#2563eb',
    }
  }

  return {
    descricao: '',
    tipo: 'poupanca',
    valorAlvo: '',
    valorInicial: '',
    dataInicio: todayInput(),
    dataAlvo: '',
    cor: '#2563eb',
  }
}

function getMetaStatus(meta: MetaDTO) {
  if (meta.status === 'concluida') {
    return {
      label: 'concluida',
      variant: 'primary' as const,
      iconClassName: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-accent-blue dark:bg-blue-950/30',
      progressClassName: 'h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all',
    }
  }
  if (meta.status === 'pausada') {
    return {
      label: 'pausada',
      variant: 'default' as const,
      iconClassName: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300',
      progressClassName: 'h-full rounded-full bg-gray-400 transition-all',
    }
  }
  if (meta.status === 'cancelada') {
    return {
      label: 'cancelada',
      variant: 'error' as const,
      iconClassName: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300',
      progressClassName: 'h-full rounded-full bg-red-400 transition-all',
    }
  }
  return {
    label: 'ativa',
    variant: 'success' as const,
    iconClassName: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-300',
    progressClassName: 'h-full rounded-full bg-green-500 transition-all',
  }
}

function centsToDisplay(value: number) {
  return (value / 100).toFixed(2).replace('.', ',')
}

function dateInput(value: string) {
  return value.slice(0, 10)
}

function todayInput() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value))
}
