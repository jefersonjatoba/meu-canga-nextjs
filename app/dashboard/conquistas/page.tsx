import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { prisma } from '@/lib/prisma'
import { calcularConquistas } from '@/lib/achievements'
import { AchievementsCard } from '@/components/ui/AchievementsCard'
import { Trophy, Flame, Zap } from 'lucide-react'

export default async function ConquistasPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const agora = new Date()
  const [userRow, counts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, streakDays: true, longestStreak: true },
    }),
    Promise.all([
      prisma.lancamento.count({ where: { userId: user.id } }),
      prisma.rasAgenda.count({ where: { userId: user.id, deletadoEm: null } }),
      prisma.meta.count({ where: { userId: user.id } }),
      prisma.conta.count({ where: { userId: user.id } }),
      prisma.recorrencia.count({ where: { userId: user.id } }),
      prisma.referral.count({ where: { referrerId: user.id } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { createdAt: true } })
        .then((u) => u ? Math.floor((agora.getTime() - u.createdAt.getTime()) / 86_400_000) : 99),
    ]),
  ])

  const [nLancamentos, nRas, nMetas, nContas, nRecorrencias, nReferrals, diasCadastro] = counts

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

  const conquistadas = achievements.filter((a) => a.conquistado)
  const streakDays = userRow?.streakDays ?? 0
  const longestStreak = userRow?.longestStreak ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conquistas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete ações no app para desbloquear medalhas e acompanhar seu progresso.
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-2">
            <Trophy size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{conquistadas.length}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">de {achievements.length} desbloqueadas</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-2">
            <Flame size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{streakDays}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">dias seguidos</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-4 text-center">
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-2">
            <Zap size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{longestStreak}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">maior sequência</p>
        </div>
      </div>

      {/* Card de conquistas completo */}
      <AchievementsCard
        achievements={achievements}
        streakDays={streakDays}
        longestStreak={longestStreak}
      />
    </div>
  )
}
