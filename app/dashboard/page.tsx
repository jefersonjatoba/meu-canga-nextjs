import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { FinancialHeroCard } from '@/features/dashboard/components/FinancialHeroCard'
import { DashboardAlerts } from '@/features/dashboard/components/DashboardAlerts'
import { CashflowSection } from '@/features/dashboard/components/CashflowSection'
import { RasSummaryCard } from '@/features/dashboard/components/RasSummaryCard'
import { UpcomingScheduleCard } from '@/features/dashboard/components/UpcomingScheduleCard'
import { CreditCardOverview } from '@/features/dashboard/components/CreditCardOverview'
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions'
import { DashboardEmptyState } from '@/features/dashboard/components/DashboardEmptyState'

type Props = {
  searchParams: Promise<{ mes?: string }>
}

function countAlerts(summary: any): number {
  let count = 0

  // Contar faturas vencendo em até 5 dias
  if (summary.cartao?.faturasProximas && summary.cartao.faturasProximas.length > 0) {
    const faturaMaisUrgente = summary.cartao.faturasProximas[0]
    if (faturaMaisUrgente?.dataVencimento) {
      const vencimento = new Date(faturaMaisUrgente.dataVencimento)
      const hoje = new Date()
      const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      if (diasAteVencimento <= 5) count++
    }
  }

  // Limite de gastos >80%
  if (summary.cartao?.limiteUsadoCentavos && summary.cartao.totalLimiteCentavos) {
    const percentualUsado = (summary.cartao.limiteUsadoCentavos / summary.cartao.totalLimiteCentavos) * 100
    if (percentualUsado >= 80) count++
  }

  return count
}

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const { mes } = await searchParams
  const summary = await getDashboardSummaryForUser(user.id, { mes })

  const alertCount = countAlerts(summary)

  return (
    <div className="space-y-5">
      <DashboardHeader periodoLabel={summary.periodoLabel} userName={user.name} alertCount={alertCount} />

      <DashboardAlerts summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <FinancialHeroCard
            saldoOperacionalCentavos={summary.saldoOperacionalCentavos}
            periodoLabel={summary.periodoLabel}
          />

          <CashflowSection
            totalReceitasCentavos={summary.totalReceitasCentavos}
            totalDespesasCentavos={summary.totalDespesasCentavos}
            totalRasCentavos={summary.totalRasCentavos}
            patrimonioInvestidoCentavos={summary.patrimonioInvestidoCentavos}
            taxaPoupancaPercentual={summary.taxaPoupancaPercentual}
          />
        </div>

        <div className="lg:col-span-1 space-y-5">
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
      </div>

      <CreditCardOverview summary={summary.cartao} />

      {summary.hasLancamentos ? (
        <RecentTransactions items={summary.lancamentosRecentes} />
      ) : (
        <DashboardEmptyState />
      )}
    </div>
  )
}
