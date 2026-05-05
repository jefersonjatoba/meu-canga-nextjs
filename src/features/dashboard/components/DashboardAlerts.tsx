'use client'

import Link from 'next/link'
import { AlertCircle, Calendar, TrendingUp, Zap } from 'lucide-react'
import type { DashboardSummaryDTO } from '@/features/dashboard/types'
import { formatBRL } from '@/lib/money'

interface Alert {
  id: string
  type: 'fatura' | 'meta' | 'ras' | 'limite'
  severity: 'error' | 'warning' | 'success' | 'info'
  title: string
  description: string
  action?: { label: string; href: string }
  icon: React.ReactNode
}

interface DashboardAlertsProps {
  summary: DashboardSummaryDTO
}

function getAlerts(summary: DashboardSummaryDTO): Alert[] {
  const alerts: Alert[] = []

  // Alerta 1: Faturas vencendo próximas
  if (summary.cartao?.faturasProximas && summary.cartao.faturasProximas.length > 0) {
    const faturaMaisUrgente = summary.cartao.faturasProximas[0]
    if (faturaMaisUrgente && faturaMaisUrgente.dataVencimento) {
      const vencimento = new Date(faturaMaisUrgente.dataVencimento)
      const hoje = new Date()
      const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      if (diasAteVencimento <= 5) {
        const severity = diasAteVencimento <= 1 ? 'error' : diasAteVencimento <= 3 ? 'warning' : 'info'
        const diaLabel = diasAteVencimento === 0 ? 'hoje' : `em ${diasAteVencimento} ${diasAteVencimento === 1 ? 'dia' : 'dias'}`

        alerts.push({
          id: 'fatura-proxima',
          type: 'fatura',
          severity,
          title: `Fatura ${faturaMaisUrgente.contaNome} vence ${diaLabel}`,
          description: `${formatBRL(faturaMaisUrgente.totalCentavos)} para pagar`,
          action: { label: 'Ver fatura', href: '/dashboard/cartoes' },
          icon: <Calendar size={16} />,
        })
      }
    }
  }

  // Alerta 2: Meta de poupança atingida
  if (summary.taxaPoupancaPercentual >= 100) {
    alerts.push({
      id: 'meta-poupanca',
      type: 'meta',
      severity: 'success',
      title: `Parabéns! 🎉`,
      description: `Você atingiu 100% da meta de poupança em ${summary.periodoLabel}`,
      icon: <TrendingUp size={16} />,
    })
  } else if (summary.taxaPoupancaPercentual >= 80) {
    alerts.push({
      id: 'meta-poupanca-proxima',
      type: 'meta',
      severity: 'info',
      title: `Meta de poupança em dia`,
      description: `${summary.taxaPoupancaPercentual.toFixed(1)}% — falta pouco para atingir 100%`,
      icon: <TrendingUp size={16} />,
    })
  }

  // Alerta 3: Limite de gastos próximo
  if (summary.cartao?.limiteUsadoCentavos && summary.cartao.totalLimiteCentavos) {
    const percentualUsado = (summary.cartao.limiteUsadoCentavos / summary.cartao.totalLimiteCentavos) * 100
    if (percentualUsado >= 80) {
      alerts.push({
        id: 'limite-proximo',
        type: 'limite',
        severity: percentualUsado >= 95 ? 'error' : 'warning',
        title: `Limite disponível ${percentualUsado >= 95 ? 'quase esgotado' : 'em alerta'}`,
        description: `${percentualUsado.toFixed(0)}% do seu limite está em uso`,
        action: { label: 'Gerenciar limite', href: '/dashboard/cartoes' },
        icon: <Zap size={16} />,
      })
    }
  }

  return alerts
}

const severityStyles = {
  error: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30',
  warning: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30',
  success: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30',
  info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',
}

const severityTextStyles = {
  error: 'text-red-700 dark:text-red-400',
  warning: 'text-orange-700 dark:text-orange-400',
  success: 'text-green-700 dark:text-green-400',
  info: 'text-blue-700 dark:text-blue-400',
}

const severityIconStyles = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-orange-600 dark:text-orange-400',
  success: 'text-green-600 dark:text-green-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function DashboardAlerts({ summary }: DashboardAlertsProps) {
  const alerts = getAlerts(summary)

  if (alerts.length === 0) return null

  return (
    <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory -mx-5 px-5 md:mx-0 md:px-0 pb-2 md:pb-0">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex-shrink-0 w-full md:flex-shrink-0 md:w-auto rounded-xl border p-4 flex items-start gap-3 snap-center ${severityStyles[alert.severity]}`}
        >
          <div className={`flex-shrink-0 mt-0.5 ${severityIconStyles[alert.severity]}`}>
            <AlertCircle size={18} aria-hidden />
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${severityTextStyles[alert.severity]}`}>{alert.title}</p>
            <p className={`text-xs mt-0.5 ${severityTextStyles[alert.severity]} opacity-85`}>{alert.description}</p>

            {alert.action && (
              <Link
                href={alert.action.href}
                className={`inline-flex text-xs font-medium mt-2 underline ${severityTextStyles[alert.severity]} hover:opacity-75 transition-opacity`}
              >
                {alert.action.label} →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
