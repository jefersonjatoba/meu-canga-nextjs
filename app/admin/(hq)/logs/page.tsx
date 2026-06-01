import { prisma } from '@/lib/prisma'

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type EventItem = {
  id: string
  type: 'signup' | 'subscription' | 'login'
  title: string
  subtitle: string
  at: Date
}

export default async function AdminLogsPage() {
  const [recentUsers, recentSubs, recentLogins] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { lastSeenAt: { not: null } },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
      select: { id: true, name: true, email: true, lastSeenAt: true, plan: true },
    }),
  ])

  // Unified event feed
  const events: EventItem[] = [
    ...recentUsers.map((u) => ({
      id: `signup-${u.id}`,
      type: 'signup' as const,
      title: `Novo cadastro: ${u.name}`,
      subtitle: u.email,
      at: u.createdAt,
    })),
    ...recentSubs.map((s) => ({
      id: `sub-${s.id}`,
      type: 'subscription' as const,
      title: `Assinatura ${s.status}: ${s.user.name}`,
      subtitle: `${s.source} · ${(s.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      at: s.createdAt,
    })),
    ...recentLogins
      .filter((u) => u.lastSeenAt)
      .map((u) => ({
        id: `login-${u.id}`,
        type: 'login' as const,
        title: `Login: ${u.name}`,
        subtitle: u.email,
        at: u.lastSeenAt!,
      })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  function typeConfig(type: EventItem['type']) {
    switch (type) {
      case 'signup':
        return { dot: 'bg-indigo-400', label: 'Cadastro', labelClass: 'text-indigo-400' }
      case 'subscription':
        return { dot: 'bg-emerald-400', label: 'Assinatura', labelClass: 'text-emerald-400' }
      case 'login':
        return { dot: 'bg-gray-500', label: 'Login', labelClass: 'text-gray-500' }
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">Logs de atividade</h1>
        <p className="text-xs text-gray-500 mt-0.5">Eventos recentes do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Cadastros recentes</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{recentUsers.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">últimos 50</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Eventos de assinatura</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{recentSubs.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">últimos 50</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Últimos logins</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{recentLogins.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">últimos 50</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Unified event feed */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Feed de eventos ({events.length})
            </p>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
            {events.map((event) => {
              const cfg = typeConfig(event.type)
              return (
                <div key={event.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <div className="w-px flex-1 bg-white/[0.04] mt-1 min-h-[16px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold uppercase tracking-widest ${cfg.labelClass}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-gray-600">{fmtDateTime(event.at)}</span>
                    </div>
                    <p className="text-xs text-gray-200 mt-0.5 truncate">{event.title}</p>
                    <p className="text-[10px] text-gray-600 truncate">{event.subtitle}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent logins panel */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Últimos logins</p>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[600px] overflow-y-auto">
            {recentLogins.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-300 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-600">{fmtDateTime(u.lastSeenAt!)}</p>
                </div>
                {u.plan === 'pro' && (
                  <span className="text-[10px] font-semibold text-amber-400">PRO</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Cadastros recentes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Usuário</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Plano</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium text-gray-200">{u.name}</p>
                    <p className="text-[10px] text-gray-600">{u.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.plan === 'pro' ? (
                      <span className="text-[10px] font-semibold text-amber-400">PRO</span>
                    ) : (
                      <span className="text-[10px] text-gray-600">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-gray-500">{fmtDateTime(u.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
