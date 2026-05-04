'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fmtBRL } from '@/types/ras'
import type { RasMonthStats, StatusRas } from '@/types/ras'

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipContentStyle = {
  background: '#1E1E1E',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
}

const tooltipLabelStyle = { color: '#f3f4f6' }

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasChartsProps {
  stats: RasMonthStats
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasCharts({ stats }: RasChartsProps) {
  const statuses: StatusRas[] = ['agendado', 'realizado', 'pendente', 'confirmado']

  const horasData = statuses
    .filter((s) => (stats.horasPorStatus?.[s] ?? 0) > 0)
    .map((s) => ({
      status: s.charAt(0).toUpperCase() + s.slice(1),
      horas: stats.horasPorStatus?.[s] ?? 0,
    }))

  const valorData = statuses
    .filter((s) => (stats.centavosPorStatus?.[s] ?? 0) > 0)
    .map((s) => ({
      status: s.charAt(0).toUpperCase() + s.slice(1),
      valor: (stats.centavosPorStatus?.[s] ?? 0) / 100,
    }))

  if (horasData.length === 0 && valorData.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Horas por Status */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Horas por Status
        </h3>
        {horasData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={horasData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(107,114,128,0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="status"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}h`}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v) => [`${v}h`, 'Horas']}
                cursor={{ fill: 'rgba(107,114,128,0.08)' }}
              />
              <Bar dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Sem dados para exibir
          </div>
        )}
      </div>

      {/* Valor por Status */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Valor por Status
        </h3>
        {valorData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={valorData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(107,114,128,0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="status"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(v) => [
                  fmtBRL(Math.round(Number(v) * 100)),
                  'Valor',
                ]}
                cursor={{ fill: 'rgba(107,114,128,0.08)' }}
              />
              <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Sem dados para exibir
          </div>
        )}
      </div>
    </div>
  )
}
