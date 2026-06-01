import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AgenteIAWorkspace } from '@/features/agente-ia/components/AgenteIAWorkspace'
import type { AgenteIaSnapshot } from '@/features/agente-ia/types'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { getDashboardSummaryForUser } from '@/server/services/dashboard.service'
import { isAnthropicConfigured } from '@/server/services/assistente.service'
import { currentMonthBR } from '@/lib/dates'
import { getActivePlan } from '@/lib/plans'
import { prisma } from '@/lib/prisma'

export default async function AgenteIAPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const mes = currentMonthBR()
  const [userRow, summary, metasAtivas, recorrenciasAtivas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, plan: true, planExpiresAt: true },
    }),
    getDashboardSummaryForUser(user.id, { mes }),
    prisma.meta.count({ where: { userId: user.id, status: 'ativa' } }),
    prisma.recorrencia.count({ where: { userId: user.id, ativa: true } }),
  ])

  if (!userRow) redirect('/auth/login')

  const plan = getActivePlan(userRow)
  const isPro = plan.nome === 'pro'
  const isConfigured = isAnthropicConfigured()

  const snapshot: AgenteIaSnapshot = {
    periodoLabel: summary.periodoLabel,
    saldoOperacionalCentavos: summary.saldoOperacionalCentavos,
    totalReceitasCentavos: summary.totalReceitasCentavos,
    totalDespesasCentavos: summary.totalDespesasCentavos,
    limiteDisponivelCentavos: summary.cartao.limiteDisponivelCentavos,
    faturaAtualCentavos: summary.cartao.proximaFatura?.totalCentavos ?? summary.cartao.valorFaturasAbertasCentavos,
    metasAtivas,
    recorrenciasAtivas,
    rasHorasMes: summary.totalRasHoras ?? 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
            <Sparkles size={13} />
            Agente IA financeiro
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
            Diagnóstico inteligente com contexto real do seu app.
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400 md:text-base">
            Use o agente para cruzar saldo, cartão, metas, RAS, escala e compromissos fixos. A proposta aqui não é um chat genérico,
            e sim uma leitura prática do seu momento financeiro-operacional.
          </p>
        </div>

        {!isPro ? (
          <Link href="/dashboard/upgrade">
            <Button leftIcon={<Sparkles size={16} />}>Assinar PRO</Button>
          </Link>
        ) : null}
      </div>

      <AgenteIAWorkspace
        isPro={isPro}
        isConfigured={isConfigured}
        userName={userRow.name}
        snapshot={snapshot}
      />
    </div>
  )
}
