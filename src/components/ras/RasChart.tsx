'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import { fmtBRL } from '@/types/ras'
import { useTheme } from '@/hooks/useTheme'

// ─── Theme-aware chart config hook ───────────────────────────────────────────

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    tooltipStyle: {
      contentStyle: {
        background: isDark ? '#1C1C1C' : '#FFFFFF',
        border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #E5E7EB',
        borderRadius: 8,
        fontSize: 12,
        color: isDark ? '#F3F4F6' : '#111827',
      },
      labelStyle: { color: isDark ? '#D1D5DB' : '#374151' },
      wrapperStyle: { outline: 'none' },
    },
    tickColor: isDark ? '#9CA3AF' : '#6B7280',
    gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    legendColor: isDark ? '#9CA3AF' : '#6B7280',
  }
}

// ─── Monthly Hours Bar Chart ──────────────────────────────────────────────────

interface MonthlyDataPoint {
  mes: string
  horas: number
  valor: number
}

interface RasHorasChartProps {
  data: MonthlyDataPoint[]
  isLoading?: boolean
  title?: string
  className?: string
}

export function RasHorasChart({
  data,
  isLoading = false,
  title = 'Horas por Mês',
  className,
}: RasHorasChartProps) {
  const { tooltipStyle, tickColor, gridColor } = useChartTheme()

  if (isLoading) {
    return (
      <div
        className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
      >
        <div className="h-4 w-32 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="mes"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [`${v}h`, 'Horas']}
          />
          <Bar dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Monthly Income Bar Chart ─────────────────────────────────────────────────

interface RasValorChartProps {
  data: MonthlyDataPoint[]
  isLoading?: boolean
  title?: string
  className?: string
}

export function RasValorChart({
  data,
  isLoading = false,
  title = 'Valor por Mês',
  className,
}: RasValorChartProps) {
  const { tooltipStyle, tickColor, gridColor } = useChartTheme()

  if (isLoading) {
    return (
      <div
        className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
      >
        <div className="h-4 w-32 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="mes"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v}`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v) => [fmtBRL(Number(v) * 100), 'Valor']}
          />
          <Bar
            dataKey="valor"
            name="Valor (R$)"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Projected Income Line Chart ──────────────────────────────────────────────

interface ProjectedDataPoint {
  mes: string
  realizado: number
  projetado: number
}

interface RasProjecaoChartProps {
  data: ProjectedDataPoint[]
  isLoading?: boolean
  title?: string
  className?: string
}

export function RasProjecaoChart({
  data,
  isLoading = false,
  title = 'Projeção de Renda',
  className,
}: RasProjecaoChartProps) {
  const { tooltipStyle, tickColor, gridColor, legendColor } = useChartTheme()

  if (isLoading) {
    return (
      <div
        className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
      >
        <div className="h-4 w-40 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="mes"
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${v}`}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(v, name) => [
              fmtBRL(Number(v) * 100),
              name === 'realizado' ? 'Realizado' : 'Projetado',
            ]}
          />
          <Legend
            wrapperStyle={{ color: legendColor, fontSize: 11 }}
            formatter={(value) =>
              value === 'realizado' ? 'Realizado' : 'Projetado'
            }
          />
          <Line
            type="monotone"
            dataKey="realizado"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: '#10b981' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="projetado"
            stroke="#60a5fa"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: '#60a5fa' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Pie Chart — RAS by Type ──────────────────────────────────────────────────

interface TipoDataPoint {
  name: string
  value: number
  color: string
}

interface RasTipoPieChartProps {
  voluntario: number
  compulsorio: number
  title?: string
  className?: string
}

export function RasTipoPieChart({
  voluntario,
  compulsorio,
  title = 'RAS por Tipo',
  className,
}: RasTipoPieChartProps) {
  const { tooltipStyle, legendColor } = useChartTheme()

  const data: TipoDataPoint[] = [
    { name: 'Voluntário', value: voluntario, color: '#60a5fa' },
    { name: 'Compulsório', value: compulsorio, color: '#f59e0b' },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div
        className={cn('rounded-xl p-4 flex items-center justify-center bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
        style={{ minHeight: 160 }}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">Sem dados para este período</p>
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl p-4 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-white/[0.08]', className)}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
            label={({ percent }) =>
              `${Math.round((percent ?? 0) * 100)}%`
            }
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(v, name) => [v, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: legendColor }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RasHorasChart
