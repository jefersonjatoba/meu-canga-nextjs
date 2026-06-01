import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Saúde do Sistema' }

function Bar({ value, max, color = 'bg-indigo-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default async function SistemaPage() {
  const [
    totalUsers,
    totalLancamentos,
    totalRas,
    totalEscalas,
    totalMetas,
    totalContas,
    totalRecorrencias,
    totalCompras,
    totalInvestimentos,
    totalReferrals,
    totalSubscriptions,
    topStreaks,
    topLancamentos,
    planBreakdown,
    sourceBreakdown,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lancamento.count(),
    prisma.rasAgenda.count({ where: { deletadoEm: null } }),
    prisma.escala.count(),
    prisma.meta.count(),
    prisma.conta.count(),
    prisma.recorrencia.count(),
    prisma.compraCartao.count(),
    prisma.investimento.count(),
    prisma.referral.count(),
    prisma.subscription.count(),
    prisma.user.findMany({
      orderBy: { streakDays: 'desc' },
      take: 5,
      select: { name: true, email: true, streakDays: true, longestStreak: true, plan: true },
    }),
    prisma.lancamento.groupBy({
      by: ['userId'],
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5,
    }),
    prisma.user.groupBy({
      by: ['plan'],
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ['source'],
      _count: { _all: true },
    }),
  ])

  // Busca nomes para top lancamentos
  const topLancIds = topLancamentos.map((l) => l.userId)
  const topLancUsers = await prisma.user.findMany({
    where: { id: { in: topLancIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = new Map(topLancUsers.map((u) => [u.id, u]))

  const dbStats = [
    { label: 'Usuários',      value: totalUsers,          color: 'bg-indigo-500' },
    { label: 'Lançamentos',   value: totalLancamentos,    color: 'bg-emerald-500' },
    { label: 'RAS Agendados', value: totalRas,             color: 'bg-amber-500' },
    { label: 'Escalas',       value: totalEscalas,         color: 'bg-blue-500' },
    { label: 'Metas',         value: totalMetas,           color: 'bg-purple-500' },
    { label: 'Contas',        value: totalContas,          color: 'bg-cyan-500' },
    { label: 'Recorrências',  value: totalRecorrencias,    color: 'bg-pink-500' },
    { label: 'Compras Cartão',value: totalCompras,         color: 'bg-orange-500' },
    { label: 'Investimentos', value: totalInvestimentos,   color: 'bg-teal-500' },
    { label: 'Indicações',    value: totalReferrals,       color: 'bg-red-500' },
    { label: 'Assinaturas',   value: totalSubscriptions,   color: 'bg-violet-500' },
  ]
  const maxStat = Math.max(...dbStats.map((s) => s.value), 1)

  const crons = [
    { path: '/api/cron/ras-transition',    schedule: 'A cada hora', desc: 'Transição automática de status RAS' },
    { path: '/api/cron/email-engagement',  schedule: 'Diário 09h',  desc: 'E-mail D+7 e D+14 de reengajamento' },
    { path: '/api/cron/email-monthly-summary', schedule: 'Dia 2 de cada mês 08h', desc: 'Resumo mensal por e-mail' },
    { path: '/api/cron/email-churn-warning',   schedule: 'Diário 10h', desc: 'Alertas de 7/14/21 dias sem login' },
  ]

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">Saúde do Sistema</h1>
        <p className="text-xs text-gray-500 mt-0.5">Contagem de registros em todos os modelos · Crons configurados · Top usuários</p>
      </div>

      {/* DB Stats */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Registros no banco de dados</p>
        </div>
        <div className="p-5 space-y-3">
          {dbStats.map((s) => (
            <div key={s.label} className="grid grid-cols-[140px_1fr_64px] items-center gap-3">
              <span className="text-xs text-gray-400">{s.label}</span>
              <Bar value={s.value} max={maxStat} color={s.color} />
              <span className="text-xs text-gray-300 text-right tabular-nums font-mono">
                {s.value.toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan + Source breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Distribuição de planos</p>
          <div className="space-y-2">
            {planBreakdown.map((p) => (
              <div key={p.plan} className="flex items-center justify-between text-sm">
                <span className={p.plan === 'pro' ? 'text-amber-400' : 'text-gray-400'}>
                  {p.plan.toUpperCase()}
                </span>
                <span className="tabular-nums text-gray-300">{p._count._all}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-5">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">Origem das assinaturas</p>
          <div className="space-y-2">
            {sourceBreakdown.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{s.source}</span>
                <span className="tabular-nums text-gray-300">{s._count._all}</span>
              </div>
            ))}
            {sourceBreakdown.length === 0 && (
              <p className="text-xs text-gray-600">Nenhuma assinatura ainda</p>
            )}
          </div>
        </div>
      </div>

      {/* Top usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top streak */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Top streaks 🔥</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topStreaks.map((u, i) => (
              <div key={u.email} className="px-5 py-3 flex items-center gap-3">
                <span className="text-[11px] text-gray-700 w-4 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-200 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-600 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-orange-400">{u.streakDays}🔥</p>
                  <p className="text-[10px] text-gray-600">max {u.longestStreak}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top lançamentos */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Top usuários por lançamentos</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topLancamentos.map((l, i) => {
              const u = userMap.get(l.userId)
              return (
                <div key={l.userId} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-[11px] text-gray-700 w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{u?.name ?? l.userId}</p>
                    <p className="text-[10px] text-gray-600 truncate">{u?.email}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {l._count._all}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Crons */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Cron jobs configurados (Vercel)</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {crons.map((c) => (
            <div key={c.path} className="px-5 py-3 flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-300">{c.path}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{c.desc}</p>
              </div>
              <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">{c.schedule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
