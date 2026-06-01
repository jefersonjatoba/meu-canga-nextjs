import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Scale, BookOpen, Shield, FileText, Bell, Sparkles, ChevronRight } from 'lucide-react'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { getActivePlan } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

export default async function BaseJuridicaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const userRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true },
  })

  const plan = getActivePlan(userRow)
  const isPro = plan.nome === 'pro'

  const topicos = [
    {
      icon: Shield,
      titulo: 'Legislação sobre RAS',
      descricao: 'Lei 13.954/2019 e regulamentos que definem limites, remuneração e direitos do RAS policial.',
    },
    {
      icon: FileText,
      titulo: 'Escala e jornada',
      descricao: 'Normas sobre plantão, sobreaviso, folga e escala extra. O que pode ser exigido e o que é voluntário.',
    },
    {
      icon: BookOpen,
      titulo: 'Benefícios e adicionais',
      descricao: 'Adicional noturno, insalubridade, periculosidade e gratificações previstas em legislação vigente.',
    },
    {
      icon: Scale,
      titulo: 'Direitos previdenciários',
      descricao: 'RPPS, IPSM, contribuições e como o RAS impacta o cálculo da aposentadoria.',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            <Scale size={13} />
            Base Jurídica
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
            Legislação e direitos do policial militar.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400 md:text-base">
            Acesso à legislação sobre RAS, escala, benefícios e direitos previdenciários — com linguagem clara e aplicada à realidade do dia a dia.
          </p>
        </div>

        {!isPro && (
          <Link
            href="/dashboard/upgrade"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
          >
            <Sparkles size={15} />
            Assinar PRO
          </Link>
        )}
      </div>

      {/* Em construção */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 px-6 py-8 text-center dark:border-violet-500/20 dark:bg-violet-500/[0.06]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/20">
          <Scale size={24} className="text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
          Módulo em construção
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
          A Base Jurídica está sendo desenvolvida com foco em legislação aplicada ao policial militar.
          Quando estiver pronta, você receberá um aviso.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
          <Bell size={15} />
          Você será notificado quando estiver disponível
        </div>
      </div>

      {/* Preview dos tópicos */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          O que estará disponível
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {topicos.map((topico) => {
            const Icon = topico.icon
            return (
              <div
                key={topico.titulo}
                className="rounded-2xl border border-gray-200 bg-white p-5 opacity-60 dark:border-white/[0.08] dark:bg-[#1C1C1C]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                    <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{topico.titulo}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{topico.descricao}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA para upgrade se free */}
      {!isPro && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Este módulo é exclusivo do plano PRO
              </p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Assine para ter acesso assim que for lançado, além de Agente IA, Investimentos e mais.
              </p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              Ver planos <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
