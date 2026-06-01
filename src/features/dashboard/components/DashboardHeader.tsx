'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Shield,
} from 'lucide-react'

interface DashboardHeaderProps {
  periodoLabel: string
  mesAtual: string
  userName?: string | null
  alertCount?: number
}

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  color: string
}

function shiftMonth(mes: string, offset: number): string {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function DashboardHeader({ periodoLabel, mesAtual, userName, alertCount = 0 }: DashboardHeaderProps) {
  const router = useRouter()
  const firstName = userName?.split(' ')[0]

  const now = new Date()
  const hora = Number(
    now.toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' }),
  )

  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const today = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })

  const quickActions: QuickAction[] = [
    {
      label: 'Receita',
      href: '/dashboard/lancamentos?tipo=income',
      icon: <ArrowDownLeft size={16} />,
      color:
        'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
    },
    {
      label: 'Despesa',
      href: '/dashboard/lancamentos?tipo=expense',
      icon: <ArrowUpRight size={16} />,
      color:
        'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20',
    },
    {
      label: 'Cartão',
      href: '/dashboard/cartoes',
      icon: <CreditCard size={16} />,
      color:
        'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20',
    },
    {
      label: 'RAS',
      href: '/dashboard/ras',
      icon: <Shield size={16} />,
      color:
        'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2.5">
          <p className="text-[11px] capitalize tracking-[0.08em] text-gray-400 dark:text-gray-500 sm:text-xs">{today}</p>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-[2rem]">
              {firstName ? `${saudacao}, ${firstName}.` : 'Painel financeiro'}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Abra o mês com clareza: caixa, cartão, rotina e os próximos impactos no mesmo radar.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="inline-flex items-center rounded-2xl border border-gray-200/80 bg-white/90 p-1 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
            <button
              onClick={() => router.push(`/dashboard?mes=${shiftMonth(mesAtual, -1)}`)}
              className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
              title="Mês anterior"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="min-w-[160px] px-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                Visão mensal
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{periodoLabel}</p>
            </div>
            <button
              onClick={() => router.push(`/dashboard?mes=${shiftMonth(mesAtual, 1)}`)}
              className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
              title="Próximo mês"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {alertCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400">
              <AlertCircle size={16} aria-hidden />
              {alertCount === 1 ? '1 ponto pede atenção' : `${alertCount} pontos pedem atenção`}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-1 pb-2 sm:gap-2.5 sm:px-0 sm:pb-0">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-all ${action.color}`}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
