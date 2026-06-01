'use client'

import { AlertCircle, Calendar, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarData } from '@/lib/escala'
import type { EscalaItem } from '@/features/dashboard/types'

const TURNO_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  plantao: {
    label: 'Plantão',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-500/10',
  },
  sobreaviso: {
    label: 'Sobreaviso',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-500/10',
  },
  extra: {
    label: 'Escala extra',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-500/10',
  },
  folga: {
    label: 'Folga',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-500/10',
  },
  ferias: {
    label: 'Férias',
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-500/10',
  },
}

function getUrgencySeverity(diasAte: number): 'critical' | 'high' | 'normal' | 'future' {
  if (diasAte === 0) return 'critical'
  if (diasAte === 1) return 'high'
  if (diasAte <= 3) return 'normal'
  return 'future'
}

function getUrgencyStyles(severity: 'critical' | 'high' | 'normal' | 'future') {
  switch (severity) {
    case 'critical':
      return {
        borderColor: 'border-red-200 dark:border-red-500/20',
        bgColor: 'bg-red-50 dark:bg-red-500/5',
        badgeBg: 'bg-red-100 dark:bg-red-500/20',
        badgeText: 'text-red-700 dark:text-red-400',
      }
    case 'high':
      return {
        borderColor: 'border-orange-200 dark:border-orange-500/20',
        bgColor: 'bg-orange-50 dark:bg-orange-500/5',
        badgeBg: 'bg-orange-100 dark:bg-orange-500/20',
        badgeText: 'text-orange-700 dark:text-orange-400',
      }
    case 'normal':
      return {
        borderColor: 'border-blue-200 dark:border-blue-500/20',
        bgColor: 'bg-blue-50 dark:bg-blue-500/5',
        badgeBg: 'bg-blue-100 dark:bg-blue-500/20',
        badgeText: 'text-blue-700 dark:text-blue-400',
      }
    default:
      return {
        borderColor: 'border-gray-200 dark:border-white/[0.08]',
        bgColor: 'bg-white dark:bg-[#1C1C1C]',
        badgeBg: 'bg-gray-100 dark:bg-white/[0.05]',
        badgeText: 'text-gray-700 dark:text-gray-400',
      }
  }
}

function getDaysLabel(dias: number): string {
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  return `Em ${dias} dias`
}

interface UpcomingScheduleCardProps {
  escala: EscalaItem | null
}

export function UpcomingScheduleCard({ escala }: UpcomingScheduleCardProps) {
  if (!escala) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Próximo turno</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum turno agendado no momento.</p>
      </div>
    )
  }

  const turnoInfo = TURNO_LABELS[escala.tipoTurno] || TURNO_LABELS.plantao
  const urgency = getUrgencySeverity(escala.diasAte)
  const styles = getUrgencyStyles(urgency)
  const daysLabel = getDaysLabel(escala.diasAte)

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm transition-all',
        styles.borderColor,
        styles.bgColor,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div
            className={cn(
              'mb-2 inline-block rounded-lg px-2.5 py-1 text-xs font-bold',
              turnoInfo.bgColor,
              turnoInfo.color,
            )}
          >
            {turnoInfo.label}
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
            Próximo turno
          </p>
        </div>
        {urgency !== 'future' && (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
              styles.badgeBg,
              styles.badgeText,
            )}
          >
            {urgency === 'critical' && <AlertCircle size={12} aria-hidden />}
            {daysLabel}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_0.9fr_1fr]">
        <div className="rounded-lg bg-white/70 p-3 dark:bg-black/15">
          <div className="flex items-start gap-2">
            <Calendar size={16} className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatarData(escala.data)}</p>
              <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">{daysLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white/70 p-3 dark:bg-black/15">
          <div className="flex items-start gap-2">
            <Clock size={16} className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {escala.horaInicio} às {escala.horaFim}
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Janela programada do turno</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white/70 p-3 dark:bg-black/15">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {escala.localServico || 'Local não informado'}
              </p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Base de referência do serviço</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
