'use client'

import { useState } from 'react'
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
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { fmtBRL } from '@/types/ras'
import type { RasMonthStats, StatusRas } from '@/types/ras'

// ─── Color Palette ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StatusRas, string> = {
  agendado: '#3b82f6',    // Blue
  realizado: '#10b981',   // Green
  pendente: '#f59e0b',    // Amber
  confirmado: '#8b5cf6',  // Purple
  cancelado: '#ef4444',   // Red
}

// Note: tooltipStyle is applied per chart using useChartTheme in RasChart.tsx
// These charts use a simpler static approach for now — light-mode safe dark tooltip
// is acceptable here as these charts only render inside the dashboard (always themed)
const tooltipStyleDark = {
  background: '#1C1C1C',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 8,
  fontSize: 12,
  color: '#F3F4F6',
}

const tooltipStyleLight = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 12,
  color: '#111827',
}

// ─── KPI Card Component ───────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ComponentType<{ size: number }>
  gradient: string
}) {
  return (
    <div className={`rounded-xl p-4 ${gradient} border border-opacity-20`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
        <div className="opacity-20">
          <Icon size={32} />
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasChartsProps {
  stats: RasMonthStats
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasCharts({ stats }: RasChartsProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const tooltipStyle = isDark ? tooltipStyleDark : tooltipStyleLight
  const tickColor = isDark ? '#9CA3AF' : '#6B7280'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const [selectedStatus, setSelectedStatus] = useState<StatusRas | null>(null)

  // Preparar dados
  const statuses: StatusRas[] = ['realizado', 'agendado', 'pendente', 'confirmado']
  const RAS_MAX_MONTHLY_HOURS = 120

  // KPI: Progresso
  const percentual = Math.round((stats.totalHoras / RAS_MAX_MONTHLY_HOURS) * 100)
  const horasRestantes = Math.max(0, RAS_MAX_MONTHLY_HOURS - stats.totalHoras)
  const isAlert = stats.totalHoras >= 96

  // Dados: Distribuição de Horas (Donut)
  const horasData = statuses
    .filter((s) => (stats.horasPorStatus?.[s] ?? 0) > 0)
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: stats.horasPorStatus?.[s] ?? 0,
      status: s,
    }))

  // Dados: Faturamento (Barra)
  const faturamentoData = statuses
    .map((s) => ({
      status: s.charAt(0).toUpperCase() + s.slice(1),
      valor: (stats.centavosPorStatus?.[s] ?? 0) / 100,
      horas: stats.horasPorStatus?.[s] ?? 0,
    }))
    .filter((d) => d.valor > 0)

  if (horasData.length === 0 && faturamentoData.length === 0) return null

  return (
    <div className="space-y-6">
      {/* ─── KPI Cards Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total de Horas"
          value={`${stats.totalHoras}h`}
          subtitle={`${percentual}% do limite`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/[0.08] dark:to-blue-500/[0.04]"
        />
        <KPICard
          title="Total Faturado"
          value={fmtBRL(stats.totalCentavos)}
          subtitle="Valor realizado"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-green-50 to-green-100 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.04]"
        />
        <KPICard
          title="Taxa Realização"
          value={`${Math.round((stats.horasPorStatus.realizado / stats.totalHoras) * 100) || 0}%`}
          subtitle={`${stats.horasPorStatus.realizado}h realizadas`}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/[0.08] dark:to-purple-500/[0.04]"
        />
        <KPICard
          title="Espaço Restante"
          value={`${horasRestantes}h`}
          subtitle={isAlert ? '⚠️ Próximo ao limite' : 'Seguro'}
          icon={isAlert ? AlertCircle : TrendingUp}
          gradient={
            isAlert
              ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/[0.08] dark:to-amber-500/[0.04]'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.04]'
          }
        />
      </div>

      {/* ─── Progress Bar ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Progresso Mensal
            </h3>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {stats.totalHoras} / {RAS_MAX_MONTHLY_HOURS}h
            </span>
          </div>

          <div className="relative h-3 bg-gray-200 dark:bg-white/[0.07] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAlert
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              style={{ width: `${Math.min(percentual, 100)}%` }}
            />
          </div>

          <div className="flex gap-2 text-xs">
            {horasRestantes > 0 && (
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-emerald-500/[0.10] dark:text-emerald-400">
                ✓ {horasRestantes}h restante
              </span>
            )}
            {isAlert && (
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/[0.10] dark:text-amber-400">
                ⚠ Próximo ao limite de 120h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Charts Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribuição de Horas - Donut com Legenda */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Distribuição por Status
          </h3>
          <div className="flex gap-6">
            {horasData.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={horasData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={500}
                    >
                      {horasData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status as StatusRas]}
                          opacity={
                            selectedStatus === null || selectedStatus === entry.status
                              ? 1
                              : 0.3
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex-1 space-y-2">
                  {horasData.map((entry) => {
                    const percent = Math.round(
                      (entry.value / stats.totalHoras) * 100
                    )
                    return (
                      <div
                        key={entry.status}
                        className="p-2 rounded cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                        onClick={() =>
                          setSelectedStatus(
                            selectedStatus === (entry.status as StatusRas)
                              ? null
                              : (entry.status as StatusRas)
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              background: STATUS_COLORS[entry.status as StatusRas],
                            }}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {entry.name}
                          </span>
                          <span className="ml-auto font-semibold text-xs text-gray-900 dark:text-gray-100">
                            {entry.value}h ({percent}%)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="w-full h-[180px] flex items-center justify-center text-sm text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>

        {/* Faturamento por Status - Barra */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Faturamento por Status
          </h3>
          {faturamentoData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={faturamentoData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(107,114,128,0.15)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="status"
                    tick={{ fill: tickColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: tickColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [fmtBRL(Math.round(Number(value) * 100)), 'Valor']}
                    cursor={{ fill: 'rgba(107,114,128,0.08)' }}
                  />
                  <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/50">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Total Faturado
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {fmtBRL(stats.totalCentavos)}
                </p>
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              Sem dados para exibir
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
