'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, TrendingUp, TrendingDown, Shield, Target, TrendingUpIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface DashboardHeaderProps {
  periodoLabel: string
  mesAtual: string // formato: "2026-05"
  userName?: string | null
  alertCount?: number
}

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  color: string
}

export function DashboardHeader({ periodoLabel, mesAtual, userName, alertCount = 0 }: DashboardHeaderProps) {
  const router = useRouter()
  const firstName = userName?.split(' ')[0]

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })

  // Calcular mês anterior e próximo
  const calcularMesAnterior = (mes: string) => {
    const [year, month] = mes.split('-').map(Number)
    if (month === 1) {
      return `${year - 1}-12`
    }
    return `${year}-${String(month - 1).padStart(2, '0')}`
  }

  const calcularProximoMes = (mes: string) => {
    const [year, month] = mes.split('-').map(Number)
    if (month === 12) {
      return `${year + 1}-01`
    }
    return `${year}-${String(month + 1).padStart(2, '0')}`
  }

  const mesAnterior = calcularMesAnterior(mesAtual)
  const proximoMes = calcularProximoMes(mesAtual)

  const navegar = (mes: string) => {
    router.push(`/dashboard?mes=${mes}`)
  }

  const quickActions: QuickAction[] = [
    {
      label: 'Receita',
      href: '/dashboard/lancamentos?tipo=income',
      icon: <TrendingUp size={16} />,
      color: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
    },
    {
      label: 'Despesa',
      href: '/dashboard/lancamentos?tipo=expense',
      icon: <TrendingDown size={16} />,
      color: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20',
    },
    {
      label: 'RAS',
      href: '/dashboard/ras',
      icon: <Shield size={16} />,
      color: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    },
    {
      label: 'Investir',
      href: '/dashboard/investimentos',
      icon: <TrendingUpIcon size={16} />,
      color: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20',
    },
    {
      label: 'Metas',
      href: '/dashboard/metas',
      icon: <Target size={16} />,
      color: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Row 1: Saudação + Badge de alertas + Navegação de mês */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 capitalize mb-0.5 sm:mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {firstName ? `Bom dia, ${firstName}.` : 'Painel Financeiro'}
          </h1>

          {/* Navegação de mês */}
          <div className="flex items-center gap-2 mt-2 sm:mt-1">
            <button
              onClick={() => navegar(mesAnterior)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title="Mês anterior"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 min-w-[120px] text-center font-medium">
              Resumo de <span className="text-gray-800 dark:text-gray-200">{periodoLabel}</span>
            </p>
            <button
              onClick={() => navegar(proximoMes)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title="Próximo mês"
              aria-label="Próximo mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {alertCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 shrink-0">
            <AlertCircle size={16} className="text-orange-600 dark:text-orange-400" aria-hidden />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              {alertCount} {alertCount === 1 ? 'alerta' : 'alertas'}
            </span>
          </div>
        )}
      </div>

      {/* Row 2: Quick Actions */}
      <div className="flex overflow-x-auto gap-2 sm:gap-3 snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 sm:pb-0">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border text-sm font-medium transition-all shrink-0 snap-center whitespace-nowrap ${action.color}`}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
            <span className="inline sm:hidden text-xs">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
