import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Activity, CreditCard, RefreshCw, Shield, Trophy } from 'lucide-react'
import { WelcomeBanner } from '@/components/ui/WelcomeBanner'
import { OnboardingChecklist } from '@/components/ui/OnboardingChecklist'
import type { OnboardingStep } from '@/components/ui/OnboardingChecklist'
import { AchievementsCard } from '@/components/ui/AchievementsCard'
import { getDataHojeSP } from '@/lib/dates'
import { calcularConquistas } from '@/lib/achievements'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import type { DashboardSummaryDTO } from '@/features/dashboard/types'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { FinancialHeroCard } from '@/features/dashboard/components/FinancialHeroCard'
import { DashboardAlerts } from '@/features/dashboard/components/DashboardAlerts'
import { DashboardCommandCenter } from '@/features/dashboard/components/DashboardCommandCenter'
import { CashflowSection } from '@/features/dashboard/components/CashflowSection'
import { FixedCommitmentsCard } from '@/features/dashboard/components/FixedCommitmentsCard'
import { CreditCardOverview } from '@/features/dashboard/components/CreditCardOverview'
import { UpcomingScheduleCard } from '@/features/dashboard/components/UpcomingScheduleCard'
import { RasSummaryCard } from '@/features/dashboard/components/RasSummaryCard'
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions'
import { DashboardEmptyState } from '@/features/dashboard/components/DashboardEmptyState'

type Props = {
  searchParams: Promise<{ mes?: string }>
}

function countAlerts(summary: DashboardSummaryDTO): number {
  let count = 0

  if (summary.cartao?.faturasProximas && summary.cartao.faturasProximas.length > 0) {
    const faturaMaisUrgente = summary.cartao.faturasProximas[0]
    if (faturaMaisUrgente?.dataVencimento) {
      const vencimento = new Date(`${faturaMaisUrgente.dataVencimento}T00:00:00Z`)
      const hoje = new Date(`${getDataHojeSP()}T00:00:00Z`)
      const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      if (diasAteVencimento <= 5) count++
    }
  }

  if (summary.cartao?.limiteUsadoCentavos && summary.cartao.totalLimiteCentavos) {
    const percentualUsado = (summary.cartao.limiteUsadoCentavos / summary.cartao.totalLimiteCentavos) * 100
    if (percentualUsado >= 80) count++
  }

  if (summary.taxaPoupancaPercentual >= 80) count++
  if ((summary.recorrenciasVencidasCount ?? 0) > 0) count++
  if ((summary.assinaturasVencidasCount ?? 0) > 0) count++

  return count
}

function SectionLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="shrink-0 text-gray-400/90 dark:text-gray-500">{icon}</span>
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-gray-200 via-gray-100 to-transparent dark:from-white/[0.08] dark:via-white/[0.03] dark:to-transparent" />
    </div>
  )
}

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const { mes } = await searchParams

  const [summary, userRow, onboardingData] = await Promise.all([
    getDashboardSummaryForUser(user.id, { mes }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, createdAt: true, streakDays: true, longestStreak: true },
    }),
    Promise.all([
      prisma.conta.count({ where: { userId: user.id } }),
      prisma.rasAgenda.count({ where: { userId: user.id, deletadoEm: null } }),
      prisma.lancamento.count({ where: { userId: user.id } }),
      prisma.recorrencia.count({ where: { userId: user.id } }),
      prisma.meta.count({ where: { userId: user.id } }),
      prisma.referral.count({ where: { referrerId: user.id } }),
    ]),
  ])

  const [nContas, nRas, nLancamentos, nRecorrencias, nMetas, nReferrals] = onboardingData

  // Reaproveita userRow.createdAt em vez de um findUnique extra (era a 7ª query)
  const diasCadastro = userRow
    ? Math.floor((Date.now() - userRow.createdAt.getTime()) / 86_400_000)
    : 99

  const achievements = calcularConquistas({
    lancamentos: nLancamentos,
    rasAgendas: nRas,
    metas: nMetas,
    contas: nContas,
    recorrencias: nRecorrencias,
    streakDays: userRow?.streakDays ?? 0,
    longestStreak: userRow?.longestStreak ?? 0,
    diasDesdeCadastro: diasCadastro,
    isPro: userRow?.plan === 'pro',
    referrals: nReferrals,
  })

  const alertCount = countAlerts(summary)
  const showOnboarding = diasCadastro <= 30

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'conta',
      label: 'Adicione sua primeira conta',
      descricao: 'Conta corrente, poupança, carteira ou o cartão principal do mês.',
      href: '/dashboard/contas',
      concluido: nContas > 0,
      pontos: 20,
    },
    {
      id: 'ras',
      label: 'Registre seu primeiro RAS',
      descricao: 'Veja a renda extra aparecer automaticamente no radar do mês.',
      href: '/dashboard/ras',
      concluido: nRas > 0,
      pontos: 30,
    },
    {
      id: 'lancamento',
      label: 'Lance uma receita ou despesa',
      descricao: 'O saldo operacional e os insights ficam mais vivos a cada movimentação.',
      href: '/dashboard/lancamentos',
      concluido: nLancamentos > 0,
      pontos: 20,
    },
    {
      id: 'recorrencia',
      label: 'Configure uma recorrência',
      descricao: 'Automatize aluguel, internet, salário e outros compromissos fixos.',
      href: '/dashboard/recorrencias',
      concluido: nRecorrencias > 0,
      pontos: 15,
    },
  ]

  return (
    <div className="space-y-6 lg:space-y-7">
      <DashboardHeader
        periodoLabel={summary.periodoLabel}
        mesAtual={summary.periodo}
        userName={user.name}
        alertCount={alertCount}
      />

      {userRow && (
        <WelcomeBanner
          userName={user.name}
          createdAt={userRow.createdAt.toISOString()}
          plan={userRow.plan}
        />
      )}

      <FinancialHeroCard
        saldoOperacionalCentavos={summary.saldoOperacionalCentavos}
        periodoLabel={summary.periodoLabel}
        saldoAnteriorCentavos={summary.saldoAnteriorCentavos}
        historicoSaldos={summary.historicoSaldos}
      />

      <DashboardCommandCenter summary={summary} />

      <DashboardAlerts summary={summary} />

      {showOnboarding && (
        <OnboardingChecklist
          steps={onboardingSteps}
          isPro={userRow?.plan === 'pro'}
        />
      )}

      <section className="space-y-4">
        <SectionLabel icon={<RefreshCw size={13} />} label="Planejamento do mês" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CashflowSection
              saldoOperacionalCentavos={summary.saldoOperacionalCentavos}
              totalReceitasCentavos={summary.totalReceitasCentavos}
              totalDespesasCentavos={summary.totalDespesasCentavos}
              totalRasCentavos={summary.totalRasCentavos}
              patrimonioInvestidoCentavos={summary.patrimonioInvestidoCentavos}
              taxaPoupancaPercentual={summary.taxaPoupancaPercentual}
            />
          </div>
          <div className="lg:col-span-1">
            <FixedCommitmentsCard
              recorrenciasPrevistasMesCentavos={summary.recorrenciasPrevistasMesCentavos ?? 0}
              assinaturasPrevistasMesCentavos={summary.assinaturasPrevistasMesCentavos ?? 0}
              totalReceitasCentavos={summary.totalReceitasCentavos}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<CreditCard size={13} />} label="Cartão e crédito" />
        <CreditCardOverview summary={summary.cartao} />
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<Shield size={13} />} label="Serviço e renda extra" />
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <UpcomingScheduleCard escala={summary.proximaEscala || null} />
          <RasSummaryCard
            horasMes={summary.totalRasHoras || 0}
            valorMesCentavos={summary.totalRasCentavos}
            proximosRas={summary.proximosRas || []}
            rasAReceberCentavos={summary.rasAReceberCentavos}
            rasHorasPendentes={summary.rasHorasPendentes}
            rasHorasConfirmadas={summary.rasHorasConfirmadas}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<Activity size={13} />} label="Atividade recente" />
        {summary.hasLancamentos ? (
          <RecentTransactions items={summary.lancamentosRecentes} />
        ) : (
          <DashboardEmptyState />
        )}
      </section>

      <section className="space-y-4">
        <SectionLabel icon={<Trophy size={13} />} label="Conquistas e progresso" />
        <AchievementsCard
          achievements={achievements}
          streakDays={userRow?.streakDays ?? 0}
          longestStreak={userRow?.longestStreak ?? 0}
        />
      </section>
    </div>
  )
}
