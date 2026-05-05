'use client'

import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatarData } from '@/lib/escala'
import type { EscalaItem } from '@/features/dashboard/types'

const TURNO_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  plantao: { label: '👮 Plantão', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-500/10' },
  sobreaviso: { label: '📱 Sobreaviso', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-500/10' },
  extra: { label: '⚡ Escala Extra', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-500/10' },
  folga: { label: '✅ Folga', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-500/10' },
  ferias: { label: '🏖️ Férias', color: 'text-cyan-700 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-500/10' },
}

function getUrgencySeverity(diasAte: number): 'critical' | 'high' | 'normal' | 'future' {
  if (diasAte === 0) return 'critical'
  if (diasAte === 1) return 'high'
  if (diasAte <= 3) return 'normal'
  return 'future'
}

function getUrgencyStyles(severity: 'critical' | 'high' | 'normal' | 'future'): {
  borderColor: string
  bgColor: string
  badgeBg: string
  badgeText: string
} {
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
  if (dias === 0) return 'HOJE'
  if (dias === 1) return 'AMANHÃ'
  return `EM ${dias} DIAS`
}

interface UpcomingScheduleCardProps {
  escala: EscalaItem | null
}

export function UpcomingScheduleCard({ escala }: UpcomingScheduleCardProps) {
  if (!escala) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Próximo Turno</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum turno agendado</p>
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
        'rounded-xl border shadow-sm p-5 flex flex-col gap-4 transition-all',
        styles.borderColor,
        styles.bgColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className={cn('inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-2', turnoInfo.bgColor, turnoInfo.color)}>
            {turnoInfo.label}
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Próximo Turno
          </p>
        </div>
        {urgency !== 'future' && (
          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap', styles.badgeBg, styles.badgeText)}>
            {urgency === 'critical' && <AlertCircle size={12} aria-hidden />}
            {daysLabel}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Data */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatarData(escala.data)}
            </p>
            {urgency !== 'future' && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {daysLabel}
              </p>
            )}
          </div>
        </div>

        {/* Horário */}
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {escala.horaInicio} às {escala.horaFim}
          </p>
        </div>

        {/* Local */}
        {escala.localServico && (
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {escala.localServico}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
