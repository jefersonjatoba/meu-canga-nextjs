import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { CashflowCards } from '@/features/dashboard/components/CashflowCards'
import { RecentTransactions } from '@/features/dashboard/components/RecentTransactions'
import { DashboardEmptyState } from '@/features/dashboard/components/DashboardEmptyState'

type Props = {
  searchParams: Promise<{ mes?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const { mes } = await searchParams
  const summary = await getDashboardSummaryForUser(user.id, { mes })

  return (
    <div className="space-y-6">
      <DashboardHeader periodoLabel={summary.periodoLabel} userName={user.name} />
      <CashflowCards {...summary} />
      {summary.hasLancamentos ? (
        <RecentTransactions items={summary.lancamentosRecentes} />
      ) : (
        <DashboardEmptyState />
      )}
    </div>
  )
}
