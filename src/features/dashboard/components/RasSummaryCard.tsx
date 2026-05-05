'use client'

import Link from 'next/link'
import { Shield, ArrowRight, Plus, Clock } from 'lucide-react'
import { formatBRL } from '@/lib/money'

interface RasItem {
  data: string
  horaInicio: string
  local: string
  duracao: number
  status?: string
}

interface RasSummaryCardProps {
  horasMes: number
  valorMesCentavos: number
  proximosRas?: RasItem[]
}

const RAS_MAX_HOURS = 120

export function RasSummaryCard({ horasMes, valorMesCentavos, proximosRas = [] }: RasSummaryCardProps) {
  const percentualHoras = Math.min(Math.max((horasMes / RAS_MAX_HOURS) * 100, 0), 100)
  const horasRestantes = Math.max(RAS_MAX_HOURS - horasMes, 0)

  // Formatar data para exibição
  const formatDate = (isoDate: string) => {
    const [, m, d] = isoDate.split('-')
    return `${d}/${m}`
  }

  // Próximos 2 RAS apenas
  const proximosRasLimitados = proximosRas.slice(0, 2)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">RAS do Mês</h2>
        </div>
        <Link
          href="/dashboard/ras"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Ver todos <ArrowRight size={12} />
        </Link>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5 flex-1">
        {/* Horas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Horas acumuladas</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {horasMes}h / {RAS_MAX_HOURS}h
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-400 transition-all duration-500 rounded-full"
              style={{ width: `${percentualHoras}%` }}
              aria-hidden
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {horasRestantes > 0 ? `${horasRestantes}h disponível` : 'Meta atingida!'}
          </p>
        </div>

        {/* Valor */}
        <div className="space-y-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Valor total RAS</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-300 tabular-nums">
            {formatBRL(valorMesCentavos)}
          </p>
        </div>

        {/* Próximos RAS */}
        {proximosRasLimitados.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Próximos RAS</p>
            <ul className="space-y-2">
              {proximosRasLimitados.map((ras, idx) => (
                <li
                  key={`${ras.data}-${ras.horaInicio}-${idx}`}
                  className="flex items-start gap-2 rounded-lg p-2.5 bg-gray-50 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.05]"
                >
                  <Clock size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {formatDate(ras.data)} às {ras.horaInicio}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {ras.local} • {ras.duracao}h
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-3 text-gray-500 dark:text-gray-400">
            <p className="text-xs">Nenhum RAS agendado</p>
          </div>
        )}
      </div>

      {/* Footer - Quick Action */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
        <Link
          href="/dashboard/ras"
          className="inline-flex items-center justify-center w-full gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-sm font-medium transition-colors"
        >
          <Plus size={14} aria-hidden />
          Agendar RAS
        </Link>
      </div>
    </div>
  )
}
