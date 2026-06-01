import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { prisma } from '@/lib/prisma'
import { CancelSubscriptionFlow } from './CancelSubscriptionFlow'

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { endsAt: true, source: true, amountCents: true },
      },
      _count: {
        select: {
          lancamentos: true,
          rasAgendas: true,
          metas: true,
          recorrencias: true,
          contas: true,
        },
      },
    },
  })

  if (!userRow) redirect('/auth/login')

  const isPro = userRow.plan === 'pro'
  const sub = userRow.subscriptions[0] ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie sua conta e assinatura</p>
      </div>

      {/* Perfil */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">Perfil</h2>
        <div className="space-y-3">
          <Row label="Nome" value={userRow.name} />
          <Row label="Email" value={userRow.email} />
          <Row label="Membro desde" value={userRow.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} />
        </div>
      </section>

      {/* Assinatura */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">Assinatura</h2>

        {isPro ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800/50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Plano PRO ativo ✨</p>
                {sub?.endsAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Renova em {sub.endsAt.toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                PRO
              </span>
            </div>

            {sub && (
              <div className="grid grid-cols-2 gap-3">
                <MiniCard label="Valor" value={sub.amountCents ? `R$ ${(sub.amountCents / 100).toFixed(2).replace('.', ',')}` : '—'} />
                <MiniCard label="Forma" value={sub.source === 'mercadopago' ? 'Mercado Pago' : sub.source} />
              </div>
            )}

            <CancelSubscriptionFlow
              userId={user.id}
              userName={userRow.name}
              stats={userRow._count}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Plano Gratuito</p>
                <p className="text-xs text-gray-500 mt-0.5">Com limites de uso mensal</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                FREE
              </span>
            </div>
            <a
              href="/dashboard/upgrade"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-500/20"
            >
              ⚡ Assinar PRO — R$ 21,90/mês
            </a>
          </div>
        )}
      </section>

      {/* Uso da conta */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-4">Uso da conta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MiniCard label="Lançamentos" value={String(userRow._count.lancamentos)} />
          <MiniCard label="RAS" value={String(userRow._count.rasAgendas)} />
          <MiniCard label="Metas" value={String(userRow._count.metas)} />
          <MiniCard label="Recorrências" value={String(userRow._count.recorrencias)} />
          <MiniCard label="Contas" value={String(userRow._count.contas)} />
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/[0.06] last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}
