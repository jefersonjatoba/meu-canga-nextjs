import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Shield, Target, TrendingUpIcon, AlertCircle } from 'lucide-react'

interface DashboardHeaderProps {
  periodoLabel: string
  userName?: string | null
  alertCount?: number
}

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  color: string
}

export function DashboardHeader({ periodoLabel, userName, alertCount = 0 }: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0]

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })

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
      {/* Row 1: Saudação + Badge de alertas */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 capitalize mb-0.5 sm:mb-1">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {firstName ? `Bom dia, ${firstName}.` : 'Painel Financeiro'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
            Resumo de{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{periodoLabel}</span>
          </p>
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
