'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, PiggyBank, Plus, Target, TrendingUp, Wallet, TimerReset } from 'lucide-react'
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

type MetaFilter = 'todas' | 'ativas' | 'pausadas' | 'concluidas' | 'canceladas'
type DecisionTone = 'blue' | 'amber' | 'green'
type DecisionItem = {
  tone: DecisionTone
  title: string
  description: string
  helper: string
}

const META_PRESETS = [
  { key: 'reserva', label: 'Reserva de emergência', tipo: 'poupanca', cor: '#16a34a' },
  { key: 'apartamento', label: 'Apartamento', tipo: 'poupanca', cor: '#2563eb' },
  { key: 'casa', label: 'Casa', tipo: 'poupanca', cor: '#1d4ed8' },
  { key: 'carro', label: 'Carro', tipo: 'poupanca', cor: '#475569' },
  { key: 'moto', label: 'Moto', tipo: 'poupanca', cor: '#7c3aed' },
  { key: 'viagem', label: 'Viagem', tipo: 'outro', cor: '#0f766e' },
  { key: 'estudos', label: 'Estudos', tipo: 'investimento', cor: '#ea580c' },
  { key: 'equipamentos', label: 'Equipamentos', tipo: 'outro', cor: '#dc2626' },
  { key: 'aposentadoria', label: 'Aposentadoria', tipo: 'investimento', cor: '#0891b2' },
] as const satisfies ReadonlyArray<{ key: string; label: string; tipo: TipoMeta; cor: string }>

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
  const [filter, setFilter] = useState<MetaFilter>('ativas')

  const contasAporte = useMemo(
    () => contas.filter(conta => conta.ativa && conta.tipo !== 'credit'),
    [contas],
  )

  const metasFiltradas = useMemo(
    () => metas.filter(meta => matchesMetaFilter(meta, filter)),
    [filter, metas],
  )

  const metasPriorizadas = useMemo(
    () => [...metasFiltradas].sort(sortMetasForPortfolio),
    [metasFiltradas],
  )

  const portfolio = useMemo(() => buildPortfolioSummary(metas), [metas])
  const portfolioDecisions = useMemo(
    () => buildPortfolioDecisions(metas, contasAporte),
    [contasAporte, metas],
  )
  const contaSugeridaAporte = useMemo(
    () => getRecommendedFundingAccount(contasAporte),
    [contasAporte],
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
    const timer = window.setTimeout(() => {
      loadBase()
    }, 0)
    return () => window.clearTimeout(timer)
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
        description: e instanceof Error ? e.message : 'Não foi possível atualizar a meta.',
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
        description: e instanceof Error ? e.message : 'Não foi possível cancelar o aporte.',
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

      <PortfolioHero portfolio={portfolio} />

      <MetaFilterBar
        filter={filter}
        onChange={setFilter}
        total={metas.length}
        visible={metasFiltradas.length}
      />

      <PortfolioDecisionBoard decisions={portfolioDecisions} />

      <MetasList
        metas={metasPriorizadas}
        hasAnyMetas={metas.length > 0}
        filter={filter}
        loading={loading}
        error={error}
        onNova={() => setCreateOpen(true)}
        onEdit={setEditTarget}
        onAporte={setAporteTarget}
        onToggle={handleToggle}
        onCancelAporte={(meta, aporteId) => setCancelAporteTarget({ meta, aporteId })}
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
        Metas são controles de planejamento. Elas não alteram automaticamente seu saldo financeiro.
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
        suggestedConta={contaSugeridaAporte}
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
  hasAnyMetas,
  filter,
  loading,
  error,
  onNova,
  onEdit,
  onAporte,
  onToggle,
  onCancelAporte,
}: {
  metas: MetaDTO[]
  hasAnyMetas: boolean
  filter: MetaFilter
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
          {hasAnyMetas ? 'Nenhuma meta encontrada neste filtro.' : 'Você ainda não criou nenhuma meta financeira.'}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {hasAnyMetas
            ? `Ajuste o filtro de ${getMetaFilterLabel(filter).toLowerCase()} ou crie uma nova meta para este objetivo.`
            : 'Use metas para acompanhar reserva de emergência, viagem, estudo ou objetivo pessoal.'}
        </p>
        <Button className="mt-5" variant="primary" onClick={onNova}>
          {hasAnyMetas ? 'Criar nova meta' : 'Criar meta'}
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

function PortfolioHero({
  portfolio,
}: {
  portfolio: ReturnType<typeof buildPortfolioSummary>
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,rgba(248,250,252,1)_0%,rgba(255,255,255,1)_56%,rgba(255,255,255,1)_100%)] p-4 shadow-sm dark:border-blue-500/20 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.92)_0%,rgba(17,24,39,0.96)_56%,rgba(12,12,12,1)_100%)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm dark:bg-black/20 dark:text-blue-300">
            <Target size={12} />
            Portfólio de objetivos
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
              O que você já guardou precisa conversar com o prazo, não só com a intenção.
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Veja quanto já está protegido, quanto ainda falta e qual pressão mensal suas metas exigem para fechar no prazo.
            </p>
          </div>
          </div>

        <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-black/15 lg:min-w-[220px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Progresso consolidado
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {portfolio.percentualConsolidado.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatBRL(portfolio.totalGuardadoCentavos)} de {formatBRL(portfolio.totalAlvoCentavos)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <PortfolioKpi
          icon={<Wallet size={16} />}
          label="Já guardado"
          value={formatBRL(portfolio.totalGuardadoCentavos)}
          helper={`${portfolio.metasAtivas} meta${portfolio.metasAtivas !== 1 ? 's' : ''} ativa${portfolio.metasAtivas !== 1 ? 's' : ''}`}
        />
        <PortfolioKpi
          icon={<Target size={16} />}
          label="Ainda faltante"
          value={formatBRL(portfolio.totalRestanteCentavos)}
          helper={portfolio.totalRestanteCentavos === 0 ? 'Portfólio no alvo' : 'Saldo que ainda precisa ser construído'}
        />
        <PortfolioKpi
          icon={<TrendingUp size={16} />}
          label="Aporte mensal sugerido"
          value={portfolio.aporteMensalSugeridoCentavos > 0 ? formatBRL(portfolio.aporteMensalSugeridoCentavos) : 'Sem prazo'}
          helper={portfolio.metasComPrazo > 0 ? `${portfolio.metasComPrazo} meta${portfolio.metasComPrazo !== 1 ? 's' : ''} com prazo ativo` : 'Defina datas-alvo para receber sugestão'}
        />
        <PortfolioKpi
          icon={<TimerReset size={16} />}
          label="Metas em risco"
          value={String(portfolio.metasEmRisco)}
          helper={portfolio.metasEmRisco > 0 ? 'Precisam de revisão de ritmo' : 'Ritmo saudável até agora'}
        />
      </div>
    </section>
  )
}

function PortfolioKpi({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-white/[0.08] dark:bg-black/15 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100 sm:text-xl">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          {icon}
        </div>
      </div>
      <p className="mt-2 hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{helper}</p>
    </div>
  )
}

function MetaFilterBar({
  filter,
  onChange,
  total,
  visible,
}: {
  filter: MetaFilter
  onChange: (filter: MetaFilter) => void
  total: number
  visible: number
}) {
  const filters: Array<{ key: MetaFilter; label: string }> = [
    { key: 'ativas', label: 'Ativas' },
    { key: 'pausadas', label: 'Pausadas' },
    { key: 'concluidas', label: 'Concluídas' },
    { key: 'canceladas', label: 'Canceladas' },
    { key: 'todas', label: 'Todas' },
  ]

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#111111] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Portfólio filtrado</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Exibindo {visible} de {total} meta{total !== 1 ? 's' : ''}.
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex w-max gap-2">
          {filters.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={[
                'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                filter === item.key
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/60',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PortfolioDecisionBoard({
  decisions,
}: {
  decisions: ReturnType<typeof buildPortfolioDecisions>
}) {
  return (
    <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 xl:mx-0 xl:grid xl:grid-cols-3 xl:overflow-visible xl:px-0 xl:pb-0">
      <DecisionCard
        tone={decisions.metaEmFoco.tone}
        eyebrow="Meta em foco"
        title={decisions.metaEmFoco.title}
        description={decisions.metaEmFoco.description}
        helper={decisions.metaEmFoco.helper}
      />
      <DecisionCard
        tone={decisions.metaMaisPerto.tone}
        eyebrow="Mais perto de concluir"
        title={decisions.metaMaisPerto.title}
        description={decisions.metaMaisPerto.description}
        helper={decisions.metaMaisPerto.helper}
      />
      <DecisionCard
        tone={decisions.caixaParaMetas.tone}
        eyebrow="Capacidade de aporte"
        title={decisions.caixaParaMetas.title}
        description={decisions.caixaParaMetas.description}
        helper={decisions.caixaParaMetas.helper}
      />
    </section>
  )
}

function DecisionCard({
  tone,
  eyebrow,
  title,
  description,
  helper,
}: {
  tone: DecisionTone
  eyebrow: string
  title: string
  description: string
  helper: string
}) {
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/10',
    amber: 'border-amber-200 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10',
    green: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10',
  } satisfies Record<typeof tone, string>

  const dotClasses = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    green: 'bg-emerald-500',
  } satisfies Record<typeof tone, string>

  return (
    <article className={`min-w-[280px] snap-start rounded-2xl border px-4 py-4 shadow-sm xl:min-w-0 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClasses[tone]}`} aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
          {eyebrow}
        </p>
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
    </article>
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
  const plan = getMetaPlan(meta)
  const timeline = getMetaTimeline(meta)
  const preset = getMetaPreset(meta.descricao)
  const confirmados = meta.aportes.filter(aporte => aporte.status === 'confirmado')
  const cancelados = meta.aportes.filter(aporte => aporte.status === 'cancelado')
  const metaSuperada = meta.progresso.progressoCentavos > meta.valorAlvoCentavos

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-[#111111]">
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: meta.cor ?? '#2563eb' }}
        aria-hidden
      />
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                {meta.descricao}
              </h2>
              <Badge variant={status.variant} size="sm" dot>
                {status.label}
              </Badge>
              <Badge variant="outline" size="sm">
                {TIPO_META_LABELS[meta.tipo]}
              </Badge>
              {preset && (
                <Badge variant="default" size="sm">
                  {preset.label}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Início {formatShortDate(meta.dataInicio)}
              {meta.dataAlvo ? ` • alvo ${formatShortDate(meta.dataAlvo)}` : ' • sem prazo final'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {timeline.aportesPlanejadosLabel}
              {timeline.aporteMensalLabel ? ` • ${timeline.aporteMensalLabel}` : ''}
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
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
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
            <span>{meta.progresso.percentual.toFixed(1)}% concluído</span>
            <span>{metaSuperada ? 'Objetivo ultrapassado' : `Faltam ${formatBRL(meta.progresso.valorRestanteCentavos)}`}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-900/40">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200/80 bg-white/90 p-3 dark:border-white/[0.08] dark:bg-black/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Aporte sugerido
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-base">
              {plan.aporteMensalSugeridoCentavos > 0 ? formatBRL(plan.aporteMensalSugeridoCentavos) : 'Sem prazo definido'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {plan.aporteMensalSugeridoCentavos > 0
                ? 'Valor mensal para chegar no objetivo no ritmo ideal.'
                : 'Defina uma data-alvo para receber sugestão mensal.'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white/90 p-3 dark:border-white/[0.08] dark:bg-black/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Ritmo da meta
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-base">
              {plan.projecaoLabel}
            </p>
            <p className={`mt-1 text-xs ${plan.healthTextClassName}`}>
              {plan.healthMessage}
            </p>
          </div>
        </div>

        <details className="group space-y-2 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-3 dark:border-white/[0.08] dark:bg-black/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
                Histórico de aportes
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Toque para ver os {confirmados.length + cancelados.length} registro{confirmados.length + cancelados.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {cancelados.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {cancelados.length} cancelado{cancelados.length !== 1 ? 's' : ''}
                </span>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180 dark:text-gray-500" />
            </div>
          </summary>
          <div className="mt-3">
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
        </details>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onEdit} className="col-span-1">
            Editar
          </Button>
          {meta.status !== 'concluida' && meta.status !== 'cancelada' && (
            <Button variant={meta.status === 'ativa' ? 'ghost' : 'primary'} size="sm" onClick={onToggle} className="col-span-1">
              {meta.status === 'ativa' ? 'Pausar' : 'Ativar'}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onAporte} disabled={meta.status === 'cancelada'} className="col-span-2 sm:col-span-1">
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
            Metas registram progresso por aportes e não alteram saldo nem criam lançamentos.
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
  const previewMeta = useMemo(() => buildPreviewMeta(values), [values])
  const previewTimeline = useMemo(() => getMetaTimeline(previewMeta), [previewMeta])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValues(initialMetaFormState(initialData))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialData])

  const applyPreset = (presetKey: string) => {
    const preset = META_PRESETS.find(item => item.key === presetKey)
    if (!preset) return
    setValues(current => ({
      ...current,
      descricao: preset.label,
      tipo: preset.tipo,
      cor: preset.cor,
    }))
  }

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
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
          Atalhos de objetivo
        </p>
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex w-max gap-2">
            {META_PRESETS.map(preset => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key)}
                className={[
                  'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                  values.descricao === preset.label
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/60',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Descrição"
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
          label="Início"
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

      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Leitura do plano
            </p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              {values.descricao.trim() || 'Sua meta'}
            </p>
          </div>
          <Badge variant="outline" size="sm">
            {TIPO_META_LABELS[values.tipo]}
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">Prazo visual</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {previewTimeline.deadlineLabel}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Aportes planejados</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {previewTimeline.aportesPlanejadosLabel}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Ritmo sugerido</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {previewTimeline.aporteMensalLabel || 'Defina um valor alvo e uma data'}
            </p>
          </div>
        </div>
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
  suggestedConta,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: MetaDTO | null
  contas: ContaDTO[]
  suggestedConta: ContaDTO | null
  onSuccess: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
          <DialogDescription>
            Este aporte atualiza o progresso da meta, mas não movimenta saldo bancário.
          </DialogDescription>
        </DialogHeader>
        {meta && (
          <AporteForm
            key={`${meta.id}:${suggestedConta?.id ?? 'none'}`}
            meta={meta}
            contas={contas}
            suggestedConta={suggestedConta}
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
            Esta ação não apaga dados. O histórico será preservado e o progresso da meta será recalculado.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                <p>
                  O aporte será marcado como cancelado. Ele deixa de contar no progresso, mas permanece visível no histórico.
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
  suggestedConta,
  onSuccess,
  onCancel,
}: {
  meta: MetaDTO
  contas: ContaDTO[]
  suggestedConta: ContaDTO | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<AporteFormState>(() => ({
    contaId: suggestedConta?.id ?? '',
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
        Este aporte atualiza o progresso da meta, mas não movimenta saldo bancário.
      </div>

      {suggestedConta && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
          Conta com mais fôlego agora: <span className="font-semibold">{suggestedConta.nome}</span>{' '}
          com {formatBRL(suggestedConta.saldoAtualCentavos)} disponíveis.
        </div>
      )}

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
          label="Conta de referência"
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
        label="Descrição"
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
      label: 'concluída',
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

function matchesMetaFilter(meta: MetaDTO, filter: MetaFilter) {
  if (filter === 'todas') return true
  if (filter === 'ativas') return meta.status === 'ativa'
  if (filter === 'pausadas') return meta.status === 'pausada'
  if (filter === 'concluidas') return meta.status === 'concluida'
  return meta.status === 'cancelada'
}

function sortMetasForPortfolio(a: MetaDTO, b: MetaDTO) {
  const aPriority = getMetaSortPriority(a)
  const bPriority = getMetaSortPriority(b)
  if (aPriority !== bPriority) return aPriority - bPriority

  const aDeadline = a.dataAlvo ? parseDateOnly(dateInput(a.dataAlvo)).getTime() : Number.MAX_SAFE_INTEGER
  const bDeadline = b.dataAlvo ? parseDateOnly(dateInput(b.dataAlvo)).getTime() : Number.MAX_SAFE_INTEGER
  if (aDeadline !== bDeadline) return aDeadline - bDeadline

  return b.progresso.percentual - a.progresso.percentual
}

function getMetaSortPriority(meta: MetaDTO) {
  const plan = getMetaPlan(meta)
  if (meta.status === 'ativa' && plan.health === 'atrasada') return 0
  if (meta.status === 'ativa' && plan.health === 'atencao') return 1
  if (meta.status === 'ativa') return 2
  if (meta.status === 'pausada') return 3
  if (meta.status === 'concluida') return 4
  return 5
}

function buildPortfolioSummary(metas: MetaDTO[]) {
  const metasAtivas = metas.filter(meta => meta.status === 'ativa')
  const totalGuardadoCentavos = metas.reduce((acc, meta) => acc + meta.progresso.progressoCentavos, 0)
  const totalAlvoCentavos = metas.reduce((acc, meta) => acc + meta.valorAlvoCentavos, 0)
  const totalRestanteCentavos = metas.reduce((acc, meta) => acc + meta.progresso.valorRestanteCentavos, 0)
  const percentualConsolidado = totalAlvoCentavos > 0
    ? Math.min(100, Math.round((totalGuardadoCentavos / totalAlvoCentavos) * 10_000) / 100)
    : 0

  const metasComPrazoAtivas = metasAtivas.filter(meta => !!meta.dataAlvo && meta.progresso.valorRestanteCentavos > 0)
  const aporteMensalSugeridoCentavos = metasComPrazoAtivas.reduce(
    (acc, meta) => acc + getMetaPlan(meta).aporteMensalSugeridoCentavos,
    0,
  )
  const metasEmRisco = metasAtivas.filter(meta => {
    const plan = getMetaPlan(meta)
    return plan.health === 'atrasada' || plan.health === 'atencao'
  }).length

  return {
    metasAtivas: metasAtivas.length,
    metasComPrazo: metasComPrazoAtivas.length,
    metasEmRisco,
    totalGuardadoCentavos,
    totalAlvoCentavos,
    totalRestanteCentavos,
    percentualConsolidado,
    aporteMensalSugeridoCentavos,
  }
}

function getMetaFilterLabel(filter: MetaFilter) {
  switch (filter) {
    case 'ativas':
      return 'Ativas'
    case 'pausadas':
      return 'Pausadas'
    case 'concluidas':
      return 'Concluídas'
    case 'canceladas':
      return 'Canceladas'
    default:
      return 'Todas'
  }
}

function buildPortfolioDecisions(metas: MetaDTO[], contas: ContaDTO[]) {
  const metasAtivas = metas.filter(meta => meta.status === 'ativa')
  const metasComPrazo = metasAtivas.filter(meta => !!meta.dataAlvo && meta.progresso.valorRestanteCentavos > 0)
  const metasPriorizadas = [...metasAtivas].sort(sortMetasForPortfolio)
  const metaEmFoco = metasPriorizadas[0] ?? null
  const metaMaisPerto = [...metasAtivas]
    .filter(meta => meta.progresso.valorRestanteCentavos > 0)
    .sort((a, b) => b.progresso.percentual - a.progresso.percentual)[0] ?? null

  const aporteMensalIdeal = metasComPrazo.reduce(
    (acc, meta) => acc + getMetaPlan(meta).aporteMensalSugeridoCentavos,
    0,
  )
  const aporteMensalAtual = metasAtivas.reduce(
    (acc, meta) => acc + getMetaPlan(meta).aporteMensalAtualCentavos,
    0,
  )
  const contaSugerida = getRecommendedFundingAccount(contas)

  return {
    metaEmFoco: metaEmFoco
      ? buildFocusDecision(metaEmFoco)
      : {
          tone: 'blue' as const,
          title: 'Crie sua primeira meta ativa',
          description: 'A primeira meta já destrava planejamento mensal, ritmo e alertas de prazo.',
          helper: 'Comece por reserva, viagem, troca de equipamento ou estudo.',
        },
    metaMaisPerto: metaMaisPerto
      ? buildClosestDecision(metaMaisPerto)
      : {
          tone: 'green' as const,
          title: 'Sem meta em fase final',
          description: 'Seu portfólio ainda não tem uma meta perto de concluir.',
          helper: 'Aportes regulares ajudam a criar sensação de progresso e conclusão.',
        },
    caixaParaMetas: buildFundingDecision(contaSugerida, aporteMensalIdeal, aporteMensalAtual),
  }
}

function buildFocusDecision(meta: MetaDTO): DecisionItem {
  const plan = getMetaPlan(meta)
  const tone = plan.health === 'atrasada' ? 'amber' : plan.health === 'atencao' ? 'amber' : 'blue'

  return {
    tone,
    title: meta.descricao,
    description: plan.health === 'atrasada'
      ? `Meta pressionada. Hoje faltam ${formatBRL(meta.progresso.valorRestanteCentavos)} para o objetivo.`
      : plan.health === 'atencao'
        ? `Meta pedindo ajuste leve. ${formatBRL(meta.progresso.valorRestanteCentavos)} ainda precisam entrar.`
        : `Meta ativa mais sensível do portfólio, com ${meta.progresso.percentual.toFixed(1)}% concluídos.`,
    helper: plan.aporteMensalSugeridoCentavos > 0
      ? `Para manter o prazo, reserve ${formatBRL(plan.aporteMensalSugeridoCentavos)}/mês.`
      : plan.projecaoLabel,
  }
}

function buildClosestDecision(meta: MetaDTO): DecisionItem {
  return {
    tone: 'green' as const,
    title: meta.descricao,
    description: `${meta.progresso.percentual.toFixed(1)}% do objetivo já foi construído.`,
    helper: meta.progresso.valorRestanteCentavos > 0
      ? `Falta ${formatBRL(meta.progresso.valorRestanteCentavos)} para concluir.`
      : 'Objetivo concluído.',
  }
}

function buildFundingDecision(
  contaSugerida: ContaDTO | null,
  aporteMensalIdeal: number,
  aporteMensalAtual: number,
): DecisionItem {
  if (!contaSugerida) {
    return {
      tone: 'blue' as const,
      title: 'Sem conta sugerida para aporte',
      description: 'Cadastre ou ative uma conta operacional para conectar as metas ao seu caixa.',
      helper: 'A origem do aporte deixa o planejamento mais crível no dia a dia.',
    }
  }

  const gap = Math.max(0, aporteMensalIdeal - aporteMensalAtual)
  const tone = gap > 0 && contaSugerida.saldoAtualCentavos < gap ? 'amber' as const : 'green' as const

  return {
    tone,
    title: contaSugerida.nome,
    description: `Conta com mais fôlego agora: ${formatBRL(contaSugerida.saldoAtualCentavos)} disponíveis.`,
    helper: aporteMensalIdeal > 0
      ? gap > 0
        ? `Faltam ${formatBRL(gap)}/mês para o portfólio bater o ritmo ideal.`
        : 'O ritmo atual já cobre a cadência mensal sugerida das metas.'
      : 'Defina datas-alvo para receber uma cadência mensal consolidada.',
  }
}

function getRecommendedFundingAccount(contas: ContaDTO[]) {
  return [...contas]
    .filter(conta => conta.ativa && conta.tipo !== 'credit')
    .sort((a, b) => b.saldoAtualCentavos - a.saldoAtualCentavos)[0] ?? null
}

function getMetaPreset(description: string) {
  const normalized = description.trim().toLowerCase()
  return META_PRESETS.find(preset => normalized === preset.label.toLowerCase()) ?? null
}

function getMetaPlan(meta: MetaDTO) {
  const today = parseDateOnly(todayInput())
  const dataInicio = parseDateOnly(dateInput(meta.dataInicio))
  const dataAlvo = meta.dataAlvo ? parseDateOnly(dateInput(meta.dataAlvo)) : null
  const monthsElapsed = Math.max(1, getMonthDelta(dataInicio, today))
  const remaining = meta.progresso.valorRestanteCentavos
  const aporteMensalAtualCentavos = Math.round(meta.progresso.aportesConfirmadosCentavos / monthsElapsed)

  let aporteMensalSugeridoCentavos = 0
  let prazoEsperadoPercentual = 0
  let health: 'saudavel' | 'atencao' | 'atrasada' | 'concluida' | 'pausada' | 'sem_prazo' = 'sem_prazo'
  let healthMessage = 'Defina um prazo para transformar a meta em plano mensal.'
  let healthTextClassName = 'text-gray-500 dark:text-gray-400'
  let projecaoLabel = aporteMensalAtualCentavos > 0 ? `Ritmo atual: ${formatBRL(aporteMensalAtualCentavos)}/mês` : 'Sem ritmo consistente ainda'

  if (meta.status === 'concluida' || remaining === 0) {
    health = 'concluida'
    healthMessage = 'Objetivo batido. Dá para redirecionar esforço para a próxima meta.'
    healthTextClassName = 'text-green-600 dark:text-green-400'
    projecaoLabel = 'Meta concluída'
  } else if (meta.status === 'pausada') {
    health = 'pausada'
    healthMessage = 'Meta pausada. O progresso foi preservado e pode ser retomado a qualquer momento.'
    healthTextClassName = 'text-gray-500 dark:text-gray-400'
    projecaoLabel = 'Pausada'
  } else if (dataAlvo) {
    const monthsRemaining = Math.max(1, getMonthDelta(today, dataAlvo))
    aporteMensalSugeridoCentavos = Math.ceil(remaining / monthsRemaining)

    const totalMonthsWindow = Math.max(1, getMonthDelta(dataInicio, dataAlvo))
    const elapsedWithinWindow = clamp(getMonthDelta(dataInicio, today), 0, totalMonthsWindow)
    prazoEsperadoPercentual = Math.min(100, (elapsedWithinWindow / totalMonthsWindow) * 100)
    const gap = meta.progresso.percentual - prazoEsperadoPercentual

    if (gap >= -5) {
      health = 'saudavel'
      healthMessage = 'No prazo. O progresso acompanha o calendário da meta.'
      healthTextClassName = 'text-green-600 dark:text-green-400'
    } else if (gap >= -15) {
      health = 'atencao'
      healthMessage = 'Leve atraso. Um ajuste pequeno no aporte mensal já recoloca a meta no trilho.'
      healthTextClassName = 'text-amber-600 dark:text-amber-400'
    } else {
      health = 'atrasada'
      healthMessage = 'Meta em risco. O ritmo atual não sustenta a data-alvo sem reforço de aportes.'
      healthTextClassName = 'text-red-600 dark:text-red-400'
    }

    if (aporteMensalAtualCentavos > 0) {
      const monthsToFinishAtCurrentPace = Math.ceil(remaining / aporteMensalAtualCentavos)
      projecaoLabel = `Conclusão estimada em ${formatMonthOffset(monthsToFinishAtCurrentPace)}`
    } else {
      projecaoLabel = `Para cumprir o prazo, faltam ${formatBRL(aporteMensalSugeridoCentavos)}/mês`
    }
  } else if (aporteMensalAtualCentavos > 0) {
    projecaoLabel = `Ritmo atual: ${formatBRL(aporteMensalAtualCentavos)}/mês`
    health = 'saudavel'
    healthMessage = 'Sem prazo final, mas o ritmo já está construindo progresso real.'
    healthTextClassName = 'text-blue-600 dark:text-blue-400'
  }

  return {
    aporteMensalAtualCentavos,
    aporteMensalSugeridoCentavos,
    health,
    healthMessage,
    healthTextClassName,
    prazoEsperadoPercentual,
    projecaoLabel,
  }
}

function getMetaTimeline(meta: Pick<MetaDTO, 'dataInicio' | 'dataAlvo' | 'progresso' | 'valorAlvoCentavos'>) {
  if (!meta.dataAlvo) {
    return {
      deadlineLabel: 'Sem data-alvo definida',
      aportesPlanejadosLabel: 'Sem plano de aportes ainda',
      aporteMensalLabel: '',
    }
  }

  const start = parseDateOnly(dateInput(meta.dataInicio))
  const end = parseDateOnly(dateInput(meta.dataAlvo))
  const totalMonths = Math.max(1, getMonthDelta(start, end))
  const aporteMensalSugerido = Math.ceil(Math.max(0, meta.progresso.valorRestanteCentavos) / totalMonths)

  return {
    deadlineLabel: `Meta até ${formatMonthYear(meta.dataAlvo)}`,
    aportesPlanejadosLabel: `${totalMonths} aporte${totalMonths !== 1 ? 's' : ''} planejado${totalMonths !== 1 ? 's' : ''}`,
    aporteMensalLabel: aporteMensalSugerido > 0 ? `${formatBRL(aporteMensalSugerido)}/mês sugeridos` : 'Objetivo já coberto',
  }
}

function buildPreviewMeta(values: MetaFormState) {
  const valorAlvoCentavos = values.valorAlvo ? toCents(values.valorAlvo) : 0
  const valorInicialCentavos = values.valorInicial ? toCents(values.valorInicial) : 0
  const valorRestanteCentavos = Math.max(0, valorAlvoCentavos - valorInicialCentavos)

  return {
    dataInicio: values.dataInicio || todayInput(),
    dataAlvo: values.dataAlvo || null,
    valorAlvoCentavos,
    progresso: {
      valorInicialCentavos,
      aportesConfirmadosCentavos: 0,
      progressoCentavos: valorInicialCentavos,
      valorRestanteCentavos,
      percentual: valorAlvoCentavos > 0 ? Math.min(100, (valorInicialCentavos / valorAlvoCentavos) * 100) : 0,
    },
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

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMonthDelta(from: Date, to: Date) {
  const rawMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (rawMonths <= 0) return 1
  return rawMonths + (to.getDate() >= from.getDate() ? 0 : -1) + 1
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatMonthOffset(months: number) {
  if (months <= 1) return '1 mês'
  if (months < 12) return `${months} meses`

  const years = Math.floor(months / 12)
  const extraMonths = months % 12
  if (extraMonths === 0) return years === 1 ? '1 ano' : `${years} anos`
  return `${years}a ${extraMonths}m`
}

function formatMonthYear(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}
