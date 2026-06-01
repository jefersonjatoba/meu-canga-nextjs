'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { fmtBRL } from '@/types/ras'
import type { RasMonthStats, StatusRas } from '@/types/ras'

// ─── Color Palette ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StatusRas, string> = {
  agendado:  '#3b82f6',
  realizado: '#10b981',
  pendente:  '#f59e0b',
  confirmado:'#8b5cf6',
  cancelado: '#ef4444',
}

const STATUS_LABELS: Record<StatusRas, string> = {
  agendado:  'Agendado',
  realizado: 'Realizado',
  pendente:  'Pendente',
  confirmado:'Confirmado',
  cancelado: 'Cancelado',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasChartsProps {
  stats: RasMonthStats
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasCharts({ stats }: RasChartsProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [open, setOpen] = useState(false)

  const tooltipStyle = isDark
    ? { background: '#1C1C1C', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: 12, color: '#F3F4F6' }
    : { background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#111827' }

  const tickColor  = isDark ? '#9CA3AF' : '#6B7280'
  const [selected, setSelected] = useState<StatusRas | null>(null)

  const statuses: StatusRas[] = ['realizado', 'agendado', 'pendente', 'confirmado']

  const horasData = statuses
    .filter((s) => (stats.horasPorStatus?.[s] ?? 0) > 0)
    .map((s) => ({
      name: STATUS_LABELS[s],
      value: stats.horasPorStatus?.[s] ?? 0,
      status: s,
    }))

  const faturamentoData = statuses
    .map((s) => ({
      status: STATUS_LABELS[s],
      valor: (stats.centavosPorStatus?.[s] ?? 0) / 100,
    }))
    .filter((d) => d.valor > 0)

  if (horasData.length === 0 && faturamentoData.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm overflow-hidden">
      {/* Collapsible toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Análise do mês
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-white/[0.06] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Distribuição de Horas — Donut */}
            {horasData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">
                  Distribuição de horas
                </p>
                <div className="flex gap-4 items-center">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie
                        data={horasData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={48}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={400}
                      >
                        {horasData.map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status as StatusRas]}
                            opacity={selected === null || selected === entry.status ? 1 : 0.25}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex-1 space-y-1.5">
                    {horasData.map((entry) => {
                      const pct = Math.round((entry.value / stats.totalHoras) * 100)
                      return (
                        <button
                          key={entry.status}
                          onClick={() => setSelected(selected === entry.status as StatusRas ? null : entry.status as StatusRas)}
                          className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors text-left"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: STATUS_COLORS[entry.status as StatusRas] }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">
                            {entry.name}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
                            {entry.value}h
                          </span>
                          <span className="text-[10px] text-gray-400 tabular-nums w-8 text-right">
                            {pct}%
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Faturamento por Status — Barra */}
            {faturamentoData.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">
                  Faturamento por status
                </p>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={faturamentoData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="status"
                      tick={{ fill: tickColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: tickColor, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [fmtBRL(Math.round(Number(value) * 100)), 'Valor']}
                      cursor={{ fill: 'rgba(107,114,128,0.08)' }}
                    />
                    <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
