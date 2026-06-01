import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  RefreshCw,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { formatDateBR, getDataHojeSP } from '@/lib/dates'
import type { DashboardSummaryDTO } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

type Tone = 'healthy' | 'attention' | 'critical'
type ImpactType = 'fatura' | 'recorrencia' | 'assinatura' | 'ras' | 'escala'

interface ImpactItem {
  id: string
  type: ImpactType
  title: string
  description: string
  dateLabel: string
  href: string
  urgency: Tone
  order: number
}

function getDaysUntil(date: string | Date): number {
  const dateStr = typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10)
  const todayStr = getDataHojeSP()
  const target = new Date(`${dateStr}T00:00:00Z`)
  const today = new Date(`${todayStr}T00:00:00Z`)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getCommitmentPct(summary: DashboardSummaryDTO): number | null {
  const totalFixo =
    (summary.recorrenciasPrevistasMesCentavos ?? 0) +
    (summary.assinaturasPrevistasMesCentavos ?? 0)

  if (summary.totalReceitasCentavos <= 0 || totalFixo <= 0) return null
  return Math.round((totalFixo / summary.totalReceitasCentavos) * 100)
}

function getLimitUsagePct(summary: DashboardSummaryDTO): number | null {
  if (!summary.cartao?.totalLimiteCentavos) return null
  if (summary.cartao.totalLimiteCentavos <= 0) return null
  return Math.round((summary.cartao.limiteUsadoCentavos / summary.cartao.totalLimiteCentavos) * 100)
}

function getReadiness(summary: DashboardSummaryDTO): { score: number; tone: Tone; label: string } {
  let score = 78
  const commitmentPct = getCommitmentPct(summary)
  const limitPct = getLimitUsagePct(summary)

  if (summary.saldoOperacionalCentavos < 0) score -= 28
  else if (summary.saldoOperacionalCentavos > 0) score += 4

  if (summary.recorrenciasVencidasCount) score -= Math.min(summary.recorrenciasVencidasCount * 4, 12)
  if (summary.assinaturasVencidasCount) score -= Math.min(summary.assinaturasVencidasCount * 4, 12)

  if (limitPct !== null) {
    if (limitPct >= 95) score -= 18
    else if (limitPct >= 80) score -= 12
    else if (limitPct >= 65) score -= 6
  }

  if (commitmentPct !== null) {
    if (commitmentPct > 65) score -= 16
    else if (commitmentPct > 45) score -= 8
    else if (commitmentPct <= 30) score += 4
  }

  if (summary.taxaPoupancaPercentual >= 20) score += 8
  else if (summary.taxaPoupancaPercentual >= 10) score += 3
  else score -= 5

  if ((summary.rasAReceberCentavos ?? 0) > 0) score += 5
  if (summary.cartao?.proximaFatura) {
    const daysUntil = getDaysUntil(summary.cartao.proximaFatura.dataVencimento)
    if (daysUntil <= 2) score -= 8
    else if (daysUntil <= 5) score -= 4
  }

  score = Math.max(18, Math.min(Math.round(score), 98))

  if (score >= 76) return { score, tone: 'healthy', label: 'Pronto para o mês' }
  if (score >= 56) return { score, tone: 'attention', label: 'Em observação' }
  return { score, tone: 'critical', label: 'Pressão no radar' }
}

function getPrimaryInsight(summary: DashboardSummaryDTO): {
  title: string
  description: string
  href: string
  actionLabel: string
  tone: Tone
} {
  const commitmentPct = getCommitmentPct(summary)
  const limitPct = getLimitUsagePct(summary)

  if (summary.saldoOperacionalCentavos < 0) {
    return {
      title: 'Seu caixa já entrou em terreno de atenção.',
      description: 'Reduza saídas variáveis e confira cartão, recorrências e vencimentos dos próximos dias.',
      href: '/dashboard/lancamentos',
      actionLabel: 'Revisar saídas',
      tone: 'critical',
    }
  }

  if (limitPct !== null && limitPct >= 80 && summary.cartao?.proximaFatura) {
    return {
      title: 'O cartão está puxando a atenção desta semana.',
      description: `${limitPct}% do limite já está em uso. Vale antecipar a leitura da próxima fatura para não apertar o caixa.`,
      href: '/dashboard/cartoes',
      actionLabel: 'Ver cartão',
      tone: limitPct >= 95 ? 'critical' : 'attention',
    }
  }

  if (commitmentPct !== null && commitmentPct > 55) {
    return {
      title: 'Seus compromissos fixos já pesam no mês.',
      description: `${commitmentPct}% da receita prevista já está comprometida com despesas recorrentes e assinaturas.`,
      href: '/dashboard/recorrencias',
      actionLabel: 'Ajustar previsões',
      tone: commitmentPct > 70 ? 'critical' : 'attention',
    }
  }

  if ((summary.recorrenciasVencidasCount ?? 0) > 0 || (summary.assinaturasVencidasCount ?? 0) > 0) {
    return {
      title: 'Você tem automações aguardando processamento.',
      description: 'Processe recorrências e assinaturas para manter o radar do mês alinhado com a realidade.',
      href: (summary.assinaturasVencidasCount ?? 0) > 0 ? '/dashboard/cartoes/assinaturas' : '/dashboard/recorrencias',
      actionLabel: 'Resolver agora',
      tone: 'attention',
    }
  }

  if ((summary.rasAReceberCentavos ?? 0) > 0) {
    return {
      title: 'O RAS previsto ajuda a abrir espaço no mês.',
      description: `${formatBRL(summary.rasAReceberCentavos ?? 0)} devem entrar em breve e aliviar a pressão do orçamento atual.`,
      href: '/dashboard/ras',
      actionLabel: 'Ver RAS',
      tone: 'healthy',
    }
  }

  return {
    title: 'Seu painel está estável e com boa leitura do mês.',
    description: 'Use a home para acompanhar saldo, cartão, previsões fixas e a rotina operacional sem perder o contexto.',
    href: '/dashboard/lancamentos',
    actionLabel: 'Ver atividade',
    tone: 'healthy',
  }
}

function buildImpacts(summary: DashboardSummaryDTO): ImpactItem[] {
  const impacts: ImpactItem[] = []

  if (summary.cartao?.proximaFatura) {
    const days = getDaysUntil(summary.cartao.proximaFatura.dataVencimento)
    impacts.push({
      id: 'impact-fatura',
      type: 'fatura',
      title: `Fatura ${summary.cartao.proximaFatura.contaNome}`,
      description: `${formatBRL(summary.cartao.proximaFatura.totalCentavos)} para pagar`,
      dateLabel: days <= 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days} dias`,
      href: '/dashboard/cartoes',
      urgency: days <= 2 ? 'critical' : days <= 5 ? 'attention' : 'healthy',
      order: days <= 2 ? 1 : days <= 5 ? 2 : 4,
    })
  }

  if ((summary.recorrenciasVencidasCount ?? 0) > 0) {
    const count = summary.recorrenciasVencidasCount ?? 0
    impacts.push({
      id: 'impact-recorrencias',
      type: 'recorrencia',
      title: `${count} recorrência${count > 1 ? 's' : ''} aguardando`,
      description: 'Atualize os lançamentos previstos em conta para o mês ficar consistente.',
      dateLabel: 'Agora',
      href: '/dashboard/recorrencias',
      urgency: 'attention',
      order: 2,
    })
  }

  if ((summary.assinaturasVencidasCount ?? 0) > 0) {
    const count = summary.assinaturasVencidasCount ?? 0
    impacts.push({
      id: 'impact-assinaturas',
      type: 'assinatura',
      title: `${count} assinatura${count > 1 ? 's' : ''} no cartão`,
      description: 'Registre as cobranças pendentes para manter a fatura no radar certo.',
      dateLabel: 'Agora',
      href: '/dashboard/cartoes/assinaturas',
      urgency: 'attention',
      order: 3,
    })
  }

  if (summary.proximaEscala) {
    impacts.push({
      id: 'impact-escala',
      type: 'escala',
      title: 'Próximo turno',
      description: `${summary.proximaEscala.horaInicio} às ${summary.proximaEscala.horaFim}${summary.proximaEscala.localServico ? ` • ${summary.proximaEscala.localServico}` : ''}`,
      dateLabel:
        summary.proximaEscala.diasAte === 0
          ? 'Hoje'
          : summary.proximaEscala.diasAte === 1
            ? 'Amanhã'
            : formatDateBR(summary.proximaEscala.data),
      href: '/dashboard/escala',
      urgency: summary.proximaEscala.diasAte <= 1 ? 'attention' : 'healthy',
      order: summary.proximaEscala.diasAte <= 1 ? 3 : 5,
    })
  }

  if (summary.proximosRas?.[0]) {
    const proximoRas = summary.proximosRas[0]
    impacts.push({
      id: 'impact-ras',
      type: 'ras',
      title: 'Próximo RAS',
      description: `${proximoRas.duracao}h em ${proximoRas.local}`,
      dateLabel: formatDateBR(proximoRas.data),
      href: '/dashboard/ras',
      urgency: 'healthy',
      order: 5,
    })
  }

  return impacts
    .sort((a, b) => a.order - b.order)
    .slice(0, 4)
}

const toneStyles: Record<Tone, { panel: string; ring: string; text: string; subtle: string }> = {
  healthy: {
    panel: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]',
    ring: 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-300',
    subtle: 'text-emerald-600/90 dark:text-emerald-200/80',
  },
  attention: {
    panel: 'border-orange-200 bg-orange-50/70 dark:border-orange-500/20 dark:bg-orange-500/[0.06]',
    ring: 'border-orange-200 text-orange-700 dark:border-orange-500/30 dark:text-orange-300',
    text: 'text-orange-700 dark:text-orange-300',
    subtle: 'text-orange-600/90 dark:text-orange-200/80',
  },
  critical: {
    panel: 'border-red-200 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/[0.06]',
    ring: 'border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300',
    text: 'text-red-700 dark:text-red-300',
    subtle: 'text-red-600/90 dark:text-red-200/80',
  },
}

const impactIcons: Record<ImpactType, ComponentType<{ size?: number; className?: string }>> = {
  fatura: CreditCard,
  recorrencia: RefreshCw,
  assinatura: CreditCard,
  ras: Shield,
  escala: CalendarClock,
}

const impactDots: Record<Tone, string> = {
  healthy: 'bg-emerald-500',
  attention: 'bg-orange-500',
  critical: 'bg-red-500',
}

export function DashboardCommandCenter({ summary }: { summary: DashboardSummaryDTO }) {
  const readiness = getReadiness(summary)
  const insight = getPrimaryInsight(summary)
  const impacts = buildImpacts(summary)
  const commitmentPct = getCommitmentPct(summary)
  const limitPct = getLimitUsagePct(summary)
  const tone = toneStyles[insight.tone]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5">
      <div className={cn('rounded-2xl border shadow-sm p-5 sm:p-6', tone.panel)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600 shadow-sm dark:bg-black/20 dark:text-gray-300">
              <Sparkles size={12} className="text-amber-500" />
              Pulso do momento
            </div>

            <div className="flex items-center gap-4">
              <div className={cn('flex h-20 w-20 flex-col items-center justify-center rounded-2xl border bg-white/80 shadow-sm dark:bg-black/15', tone.ring)}>
                <span className="text-2xl font-black tabular-nums">{readiness.score}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">/ 100</span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Prontidão financeira
                </p>
                <p className={cn('mt-1 text-lg font-bold', tone.text)}>{readiness.label}</p>
                <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-300">
                  Um retrato rápido do caixa, do cartão, das automações e da margem do mês.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#151515]">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 rounded-xl p-2', tone.panel)}>
                  <Wallet size={16} className={tone.text} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{insight.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>
                  <Link
                    href={insight.href}
                    className={cn('mt-3 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80', tone.text)}
                  >
                    {insight.actionLabel}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-w-[220px] grid-cols-1 gap-2 sm:min-w-[260px]">
            <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Custos fixos
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                {commitmentPct !== null ? `${commitmentPct}% da receita` : 'Sem base suficiente'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recorrências em conta + assinaturas no cartão previstas.
              </p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Cartão no mês
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                {limitPct !== null ? `${limitPct}% do limite em uso` : 'Sem cartão ativo'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leitura rápida para não misturar fatura com o caixa operacional.
              </p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-black/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Renda extra no radar
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                {(summary.rasAReceberCentavos ?? 0) > 0
                  ? formatBRL(summary.rasAReceberCentavos ?? 0)
                  : 'Nenhum RAS a receber'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Valor que pode aliviar a pressão do mês quando entrar na conta.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            Próximos impactos
          </p>
          <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">
            O que pode mexer no seu mês nos próximos dias
          </h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {impacts.length === 0 ? (
            <div className="px-5 py-5 text-sm text-gray-500 dark:text-gray-400">
              Ainda não há impactos próximos suficientes para alimentar o radar. Conforme você usar cartão,
              RAS, recorrências e escala, esse painel fica mais vivo.
            </div>
          ) : (
            impacts.map((impact) => {
              const Icon = impactIcons[impact.type]
              return (
                <Link
                  key={impact.id}
                  href={impact.href}
                  className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className={cn('mt-0.5 h-9 w-9 shrink-0 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-200', 'flex items-center justify-center')}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{impact.title}</p>
                      <span className={cn('h-2 w-2 rounded-full shrink-0', impactDots[impact.urgency])} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{impact.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{impact.dateLabel}</p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Abrir</p>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 dark:border-white/[0.05]">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use este bloco como um radar de curto prazo para caixa, cartão, serviço e renda extra.
          </p>
        </div>
      </div>
    </div>
  )
}
