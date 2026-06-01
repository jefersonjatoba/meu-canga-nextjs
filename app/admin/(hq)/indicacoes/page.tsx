import { prisma } from '@/lib/prisma'

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('pt-BR')
}

export default async function AdminIndicacoesPage() {
  const referrals = await prisma.referral.findMany({
    include: {
      referrer: { select: { id: true, name: true, email: true } },
      referred: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const total = referrals.length
  const rewarded = referrals.filter((r) => r.rewarded).length
  const conversionRate = total > 0 ? ((rewarded / total) * 100).toFixed(1) : '0.0'

  // Top referrers
  const referrerMap = new Map<string, { name: string; email: string; count: number; rewardedCount: number }>()
  for (const r of referrals) {
    const key = r.referrerId
    const existing = referrerMap.get(key)
    if (existing) {
      existing.count++
      if (r.rewarded) existing.rewardedCount++
    } else {
      referrerMap.set(key, {
        name: r.referrer.name,
        email: r.referrer.email,
        count: 1,
        rewardedCount: r.rewarded ? 1 : 0,
      })
    }
  }
  const topReferrers = Array.from(referrerMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topReferrer = topReferrers[0] ?? null

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">Indicações</h1>
        <p className="text-xs text-gray-500 mt-0.5">Sistema de referral</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-100 mt-1">{total.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-600 mt-0.5">indicações</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Convertidas</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{rewarded.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-600 mt-0.5">recompensadas</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Conversão</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{conversionRate}%</p>
          <p className="text-xs text-gray-600 mt-0.5">taxa de recompensa</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Top indicador</p>
          <p className="text-lg font-bold text-amber-400 mt-1 truncate">
            {topReferrer?.name ?? '—'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {topReferrer ? `${topReferrer.count} indicações` : 'nenhum'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leaderboard */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Top indicadores</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {topReferrers.map((ref, idx) => (
              <div key={ref.id} className="px-5 py-3 flex items-center gap-3">
                <span
                  className={`text-sm font-bold w-5 text-center shrink-0 ${
                    idx === 0
                      ? 'text-amber-400'
                      : idx === 1
                      ? 'text-gray-400'
                      : idx === 2
                      ? 'text-amber-700'
                      : 'text-gray-600'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{ref.name}</p>
                  <p className="text-[10px] text-gray-600 truncate">{ref.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-100">{ref.count}</p>
                  <p className="text-[10px] text-emerald-500">{ref.rewardedCount} ✓</p>
                </div>
              </div>
            ))}
            {topReferrers.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">
                Nenhuma indicação ainda.
              </div>
            )}
          </div>
        </div>

        {/* Referrals list */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Todas as indicações ({total})
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Indicador</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Indicado</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Recompensa</th>
                  <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-200">{ref.referrer.name}</p>
                      <p className="text-[10px] text-gray-600">{ref.referrer.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-200">{ref.referred.name}</p>
                      <p className="text-[10px] text-gray-600">{ref.referred.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {ref.rewarded ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
                          Recompensado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-white/5 text-gray-500 uppercase tracking-wider">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{fmtDate(ref.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {referrals.length === 0 && (
              <div className="px-4 py-10 text-center text-gray-600 text-sm">
                Nenhuma indicação registrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
