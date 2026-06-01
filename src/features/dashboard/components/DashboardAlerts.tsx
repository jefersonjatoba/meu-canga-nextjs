import Link from 'next/link'
import { AlertCircle, Calendar, TrendingUp, Zap } from 'lucide-react'
import { getDataHojeSP } from '@/lib/dates'
import { formatBRL } from '@/lib/money'
import type { DashboardSummaryDTO } from '@/features/dashboard/types'

interface Alert {
  id: string
  severity: 'error' | 'warning' | 'success' | 'info'
  title: string
  description: string
  action?: { label: string; href: string }
}

interface DashboardAlertsProps {
  summary: DashboardSummaryDTO
}

function getAlerts(summary: DashboardSummaryDTO): Alert[] {
  const alerts: Alert[] = []

  if (summary.cartao?.faturasProximas && summary.cartao.faturasProximas.length > 0) {
    const faturaMaisUrgente = summary.cartao.faturasProximas[0]
    if (faturaMaisUrgente?.dataVencimento) {
      const vencimento = new Date(`${faturaMaisUrgente.dataVencimento}T00:00:00Z`)
      const hoje = new Date(`${getDataHojeSP()}T00:00:00Z`)
      const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      if (diasAteVencimento <= 5) {
        const severity = diasAteVencimento <= 1 ? 'error' : diasAteVencimento <= 3 ? 'warning' : 'info'
        const diaLabel =
          diasAteVencimento === 0
            ? 'vence hoje'
            : diasAteVencimento === 1
              ? 'vence amanhã'
              : `vence em ${diasAteVencimento} dias`

        alerts.push({
          id: 'fatura-proxima',
          severity,
          title: `A próxima fatura do ${faturaMaisUrgente.contaNome} ${diaLabel}.`,
          description: `${formatBRL(faturaMaisUrgente.totalCentavos)} já estão no radar para pagamento.`,
          action: { label: 'Abrir cartão', href: '/dashboard/cartoes' },
        })
      }
    }
  }

  if (summary.taxaPoupancaPercentual >= 100) {
    alerts.push({
      id: 'meta-poupanca',
      severity: 'success',
      title: 'Sua meta de poupança foi batida no período.',
      description: `Você chegou a 100% da meta em ${summary.periodoLabel}.`,
    })
  } else if (summary.taxaPoupancaPercentual >= 80) {
    alerts.push({
      id: 'meta-poupanca-proxima',
      severity: 'info',
      title: 'A meta de poupança está bem encaminhada.',
      description: `${summary.taxaPoupancaPercentual.toFixed(1)}% concluídos até agora.`,
    })
  }

  if (summary.cartao?.limiteUsadoCentavos && summary.cartao.totalLimiteCentavos) {
    const percentualUsado = (summary.cartao.limiteUsadoCentavos / summary.cartao.totalLimiteCentavos) * 100
    if (percentualUsado >= 80) {
      alerts.push({
        id: 'limite-proximo',
        severity: percentualUsado >= 95 ? 'error' : 'warning',
        title: percentualUsado >= 95 ? 'O limite do cartão está no limite.' : 'O limite do cartão entrou em alerta.',
        description: `${percentualUsado.toFixed(0)}% do limite já está comprometido neste momento.`,
        action: { label: 'Ver limite', href: '/dashboard/cartoes' },
      })
    }
  }

  if ((summary.recorrenciasVencidasCount ?? 0) > 0) {
    const count = summary.recorrenciasVencidasCount ?? 0
    alerts.push({
      id: 'recorrencias-vencidas',
      severity: 'warning',
      title: `${count} recorrência${count > 1 ? 's' : ''} aguardando processamento.`,
      description: 'Atualize os lançamentos em conta para manter o mês coerente.',
      action: { label: 'Ir para recorrências', href: '/dashboard/recorrencias' },
    })
  }

  if ((summary.assinaturasVencidasCount ?? 0) > 0) {
    const count = summary.assinaturasVencidasCount ?? 0
    alerts.push({
      id: 'assinaturas-vencidas',
      severity: 'warning',
      title: `${count} assinatura${count > 1 ? 's' : ''} no cartão aguardando processamento.`,
      description: 'Registre as cobranças nas faturas para o cartão ficar alinhado.',
      action: { label: 'Ir para assinaturas', href: '/dashboard/cartoes/assinaturas' },
    })
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

const severityIcons = {
  error: AlertCircle,
  warning: Zap,
  success: TrendingUp,
  info: Calendar,
}

export function DashboardAlerts({ summary }: DashboardAlertsProps) {
  const alerts = getAlerts(summary)

  if (alerts.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {alerts.map((alert) => {
        const Icon = severityIcons[alert.severity] ?? AlertCircle

        return (
          <div
            key={alert.id}
            className={`rounded-2xl border p-4 ${severityStyles[alert.severity]}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 ${severityIconStyles[alert.severity]}`}>
                <Icon size={18} aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${severityTextStyles[alert.severity]}`}>{alert.title}</p>
                <p className={`mt-0.5 text-xs opacity-85 ${severityTextStyles[alert.severity]}`}>
                  {alert.description}
                </p>

                {alert.action && (
                  <Link
                    href={alert.action.href}
                    className={`mt-2 inline-flex text-xs font-medium transition-opacity hover:opacity-75 ${severityTextStyles[alert.severity]}`}
                  >
                    {alert.action.label} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
