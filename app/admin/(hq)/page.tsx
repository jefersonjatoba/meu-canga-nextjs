import { prisma } from '@/lib/prisma'
import { SignupsChart } from '@/components/admin/charts/SignupsChart'

const PRO_PRICE = 21.9

function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function planBadge(plan: string) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
        PRO
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-white/5 text-gray-400 uppercase tracking-wider">
      Free
    </span>
  )
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

export default async function AdminOverviewPage() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)
  const [
    totalUsers,
    proUsers,
    activeToday,
    activeThisWeek,
    newThisMonth,
    newLastMonth,
    churnThisMonth,
    totalLancamentos,
    totalRas,
    totalReferrals,
    recentUsers,
    recentSubs,
    usersLast30Days,
    avgStreakResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: 'pro' } }),
    prisma.user.count({ where: { lastSeenAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: startOfWeek } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.subscription.count({
      where: { status: 'cancelled', createdAt: { gte: startOfMonth } },
    }),
    prisma.lancamento.count(),
    prisma.rasAgenda.count({ where: { deletadoEm: null } }),
    prisma.referral.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, plan: true, streakDays: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.aggregate({ _avg: { streakDays: true } }),
  ])

  // Signup chart data: group by date
  const signupsByDay = (() => {
    const map = new Map<string, number>()
    // fill last 30 days with zeros
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      map.set(key, 0)
    }
    for (const u of usersLast30Days) {
      const key = new Date(u.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
  })()

  const mrr = proUsers * PRO_PRICE
  const arr = mrr * 12
  const avgStreak = avgStreakResult._avg.streakDays ?? 0
  const freeUsers = totalUsers - proUsers
  const proPercent = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0.0'
  const freePercent = totalUsers > 0 ? ((freeUsers / totalUsers) * 100).toFixed(1) : '0.0'

  const kpiCards = [
    {
      label: 'MRR',
      value: fmtCurrency(mrr),
      sub: `${proUsers} usuários PRO`,
      color: 'text-emerald-400',
      positive: mrr > 0,
    },
    {
      label: 'ARR',
      value: fmtCurrency(arr),
      sub: 'Receita anual projetada',
      color: 'text-emerald-400',
      positive: arr > 0,
    },
    {
      label: 'Usuários PRO',
      value: proUsers.toLocaleString('pt-BR'),
      sub: `${proPercent}% do total`,
      color: 'text-amber-400',
      positive: true,
    },
    {
      label: 'Total Usuários',
      value: totalUsers.toLocaleString('pt-BR'),
      sub: `+${newThisMonth} este mês`,
      color: 'text-gray-100',
      positive: newThisMonth > newLastMonth,
    },
    {
      label: 'Churn Mensal',
      value: churnThisMonth.toLocaleString('pt-BR'),
      sub: 'cancelamentos este mês',
      color: churnThisMonth > 0 ? 'text-red-400' : 'text-gray-400',
      positive: false,
    },
    {
      label: 'Ativos Hoje',
      value: activeToday.toLocaleString('pt-BR'),
      sub: `${activeThisWeek} esta semana`,
      color: 'text-indigo-400',
      positive: true,
    },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-100">Visão Geral</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Dados em tempo real — {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#111111] border border-white/[0.08] rounded-lg p-4 space-y-1"
          >
            <p className="text-[10px] uppercase tracking-widest text-gray-500">{card.label}</p>
            <p className={`text-xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-gray-600">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">Lançamentos</p>
          <p className="text-2xl font-bold text-gray-200 mt-1">{totalLancamentos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">RAS Agendamentos</p>
          <p className="text-2xl font-bold text-gray-200 mt-1">{totalRas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">Indicações</p>
          <p className="text-2xl font-bold text-gray-200 mt-1">{totalReferrals.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-600">Streak Médio</p>
          <p className="text-2xl font-bold text-gray-200 mt-1">{avgStreak.toFixed(1)}🔥</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signups chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.08] rounded-lg p-5">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Cadastros</p>
            <p className="text-sm font-semibold text-gray-200 mt-0.5">Últimos 30 dias</p>
          </div>
          <SignupsChart data={signupsByDay} />
        </div>

        {/* Plan distribution */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-5">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Distribuição</p>
            <p className="text-sm font-semibold text-gray-200 mt-0.5">Planos</p>
          </div>
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-amber-400 font-medium">PRO</span>
                <span className="text-xs text-gray-400">{proPercent}%</span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${proPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{proUsers} usuários</p>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-400 font-medium">Free</span>
                <span className="text-xs text-gray-400">{freePercent}%</span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-600 rounded-full transition-all"
                  style={{ width: `${freePercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{freeUsers} usuários</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Conversão</p>
            <p className="text-2xl font-bold text-amber-400">{proPercent}%</p>
            <p className="text-xs text-gray-600">free → pro</p>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent users */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Últimos cadastros</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentUsers.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-600 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {planBadge(u.plan)}
                  <span className="text-[10px] text-gray-600 whitespace-nowrap">
                    {u.streakDays}🔥 · {fmtDate(u.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent subscriptions */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Últimas assinaturas</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentSubs.map((sub) => (
              <div key={sub.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{sub.user.name}</p>
                  <p className="text-[10px] text-gray-600">{sub.source}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusBadge(sub.status)}
                  <span className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">
                    {fmtCurrency(sub.amountCents / 100)}
                  </span>
                  <span className="text-[10px] text-gray-600 whitespace-nowrap">
                    {fmtDate(sub.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
