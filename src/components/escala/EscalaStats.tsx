'use client'

import * as React from 'react'
import { CalendarClock, CheckCircle2, Clock, CalendarX } from 'lucide-react'

import { StatCard } from '@/components/ui/StatCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { useEscalaStats } from '@/hooks/useEscala'
import { TURNO_CONFIG } from '@/types/escala'
import type { TipoTurno } from '@/types/escala'
import { formatDate } from '@/lib/utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface EscalaStatsProps {
  mes?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ProximaEscalaCard({
  proximaEscala,
  isLoading,
}: {
  proximaEscala: { dataEscala: string; tipoTurno: string; localServico?: string | null } | null
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (!proximaEscala) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Próximo Turno</p>
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400">
            <CalendarX size={18} aria-hidden />
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight text-gray-400 dark:text-gray-600">
          Nenhum
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Sem turnos agendados
        </p>
      </div>
    )
  }

  const turno = TURNO_CONFIG[proximaEscala.tipoTurno as TipoTurno]

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Próximo Turno</p>
        <span
          className={`flex items-center justify-center w-9 h-9 rounded-lg ${turno.bgClass} ${turno.textClass}`}
          aria-hidden
        >
          <CalendarClock size={18} />
        </span>
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${turno.textClass}`}>
        {formatDate(proximaEscala.dataEscala)}
      </p>
      <div className="flex flex-col gap-1">
        <p className={`text-xs font-medium ${turno.textClass}`}>
          {turno.label} — {turno.horario}
        </p>
        {proximaEscala.localServico && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {proximaEscala.localServico}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EscalaStats({ mes }: EscalaStatsProps) {
  const { data: stats, isLoading } = useEscalaStats(mes)

  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      role="region"
      aria-label="Estatísticas de escalas"
    >
      <StatCard
        title="Agendadas (mês)"
        value={isLoading ? '—' : String(stats?.totalAgendadas ?? 0)}
        icon={<Clock size={18} />}
        accentColor="blue"
        isLoading={isLoading}
        subtext="turnos agendados"
      />

      <StatCard
        title="Realizadas (mês)"
        value={isLoading ? '—' : String(stats?.totalRealizadas ?? 0)}
        icon={<CheckCircle2 size={18} />}
        accentColor="green"
        isLoading={isLoading}
        subtext="turnos realizados"
      />

      <StatCard
        title="Canceladas (mês)"
        value={isLoading ? '—' : String(stats?.totalCanceladas ?? 0)}
        icon={<CalendarX size={18} />}
        accentColor="red"
        isLoading={isLoading}
        subtext="turnos cancelados"
      />

      <ProximaEscalaCard
        proximaEscala={stats?.proximaEscala ?? null}
        isLoading={isLoading}
      />
    </div>
  )
}
