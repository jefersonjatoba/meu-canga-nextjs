import { prisma } from '@/lib/prisma'
import { RevenueChart } from '@/components/admin/charts/RevenueChart'

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    cancelled: 'bg-red-500/15 text-red-400 border border-red-500/25',
    expired: 'bg-gray-500/15 text-gray-400 border border-gray-500/25',
    paused: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  }
  const labels: Record<string, string> = {
    active: 'Ativo',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    paused: 'Pausado',
  }
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? 'bg-white/5 text-gray-400'}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

export default async function AdminReceitaPage() {
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const subscriptions = await prisma.subscription.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const subsLast12m = subscriptions.filter(
    (s) => new Date(s.createdAt) >= twelveMonthsAgo
  )

  // MRR = active subscriptions amount
  const activeSubs = subscriptions.filter((s) => s.status === 'active')
  const mrr = activeSubs.reduce((sum, s) => sum + s.amountCents, 0)
  const arr = mrr * 12
  const totalRevenue = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'cancelled' || s.status === 'expired')
    .reduce((sum, s) => sum + s.amountCents, 0)

  // Avg duration in days
  const withDuration = subscriptions.filter((s) => s.endsAt)
  const avgDuration =
    withDuration.length > 0
      ? withDuration.reduce((sum, s) => {
          const days = Math.round(
            (new Date(s.endsAt!).getTime() - new Date(s.startsAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0) / withDuration.length
      : 0

  // Status breakdown
  const statusCounts = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {})

  // Source breakdown
  const sourceCounts = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.source] = (acc[s.source] ?? 0) + 1
    return acc
  }, {})

  // Revenue chart: last 12 months MRR (from active subs created in each month)
  const revenueByMonth = (() => {
    const map = new Map<string, number>()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      map.set(key, 0)
    }
    for (const sub of subsLast12m) {
      if (sub.status !== 'active') continue
      const key = new Date(sub.createdAt).toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      })
      if (map.has(key)) {
        map.set(key, (map.get(key) ?? 0) + sub.amountCents)
      }
    }
    return Array.from(map.entries()).map(([month, totalCents]) => ({
      month,
      mrr: totalCents / 100,
    }))
  })()

  const kpiCards = [
    { label: 'MRR', value: fmtCurrency(mrr), color: 'text-emerald-400' },
    { label: 'ARR', value: fmtCurrency(arr), color: 'text-emerald-400' },
    { label: 'Receita total', value: fmtCurrency(totalRevenue), color: 'text-gray-100' },
    { label: 'Duração média', value: `${avgDuration.toFixed(0)} dias`, color: 'text-indigo-400' },
    { label: 'Assinaturas ativas', value: (statusCounts.active ?? 0).toLocaleString('pt-BR'), color: 'text-emerald-400' },
    { label: 'Canceladas', value: (statusCounts.cancelled ?? 0).toLocaleString('pt-BR'), color: 'text-red-400' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">Receita</h1>
        <p className="text-xs text-gray-500 mt-0.5">Análise financeira e assinaturas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111111] border border-white/[0.08] rounded-lg p-4 space-y-1"
          >
            <p className="text-[10px] uppercase tracking-widest text-gray-500">{card.label}</p>
            <p className={`text-xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.08] rounded-lg p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Receita</p>
          <p className="text-sm font-semibold text-gray-200 mb-4">Últimos 12 meses (MRR por mês)</p>
          <RevenueChart data={revenueByMonth} />
        </div>

        <div className="space-y-3">
          {/* Status breakdown */}
          <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Por status</p>
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 capitalize">{status}</span>
                  <span className="text-xs font-medium text-gray-200">
                    {count.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source breakdown */}
          <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Por origem</p>
            <div className="space-y-2">
              {Object.entries(sourceCounts).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{source}</span>
                  <span className="text-xs font-medium text-gray-200">
                    {count.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full subscriptions table */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            Todas as assinaturas ({subscriptions.length})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Usuário</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Origem</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Valor</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Início</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Fim</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-200">{sub.user.name}</p>
                    <p className="text-[10px] text-gray-600">{sub.user.email}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(sub.status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{sub.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-emerald-400 font-medium">
                      {fmtCurrency(sub.amountCents)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{fmtDate(sub.startsAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{fmtDate(sub.endsAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 max-w-[120px] truncate block">
                      {sub.notes ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && (
            <div className="px-4 py-10 text-center text-gray-600 text-sm">
              Nenhuma assinatura registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
