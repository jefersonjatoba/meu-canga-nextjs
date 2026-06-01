import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AdminUserActions } from '@/components/admin/AdminUserActions'
import Link from 'next/link'

function planBadge(plan: string) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
        PRO
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-white/5 text-gray-400 uppercase tracking-wider">
      Free
    </span>
  )
}

function roleBadge(role: string) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-white/5 text-gray-400 uppercase tracking-wider">
      User
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

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function fmtCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: {
        select: {
          lancamentos: true,
          rasAgendas: true,
          metas: true,
          contas: true,
          recorrencias: true,
        },
      },
    },
  })

  if (!user) notFound()

  const statsGrid = [
    { label: 'Lançamentos', value: user._count.lancamentos },
    { label: 'RAS Agendas', value: user._count.rasAgendas },
    { label: 'Metas', value: user._count.metas },
    { label: 'Contas', value: user._count.contas },
    { label: 'Recorrências', value: user._count.recorrencias },
    { label: 'Streak atual', value: `${user.streakDays}🔥` },
    { label: 'Maior streak', value: `${user.longestStreak}🔥` },
    { label: 'Cadastro', value: fmtDate(user.createdAt) },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Link href="/admin/usuarios" className="hover:text-gray-400 transition-colors">
          Usuários
        </Link>
        <span>/</span>
        <span className="text-gray-400">{user.name}</span>
      </div>

      {/* User header */}
      <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-indigo-500/20 text-indigo-300 text-2xl font-bold flex items-center justify-center shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-100">{user.name}</h1>
              {planBadge(user.plan)}
              {roleBadge(user.role)}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            {user.cpf && (
              <p className="text-xs text-gray-600 mt-0.5">CPF: {user.cpf}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <span>Último acesso: {fmtDate(user.lastSeenAt)}</span>
              {user.planExpiresAt && (
                <span>PRO expira: {fmtDate(user.planExpiresAt)}</span>
              )}
              {user.referralCode && (
                <span>Código de indicação: <code className="text-indigo-400">{user.referralCode}</code></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statsGrid.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#111111] border border-white/[0.08] rounded-lg p-3 text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-gray-600">{stat.label}</p>
            <p className="text-lg font-bold text-gray-200 mt-1">
              {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions + Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Actions */}
        <div>
          <AdminUserActions
            userId={user.id}
            currentPlan={user.plan}
            currentRole={user.role}
          />
        </div>

        {/* Subscription history */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Histórico de assinaturas
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Origem</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Valor</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Início</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Fim</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {user.subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
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
                      <span className="text-xs text-gray-600 truncate max-w-[120px] block">
                        {sub.notes ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {user.subscriptions.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">
                Nenhuma assinatura registrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
