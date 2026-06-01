'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type RevenueDataPoint = {
  month: string
  mrr: number
}

type Props = {
  data: RevenueDataPoint[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-md px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="text-emerald-400 font-semibold">
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
    </div>
  )
}

export function RevenueChart({ data }: Props) {
  const maxValue = Math.max(...data.map((d) => d.mrr), 1)

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={18}>
        <XAxis
          dataKey="month"
          tick={{ fill: '#4b5563', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#4b5563', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="mrr" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.mrr === maxValue ? '#34d399' : '#10b981'}
              opacity={entry.mrr === maxValue ? 1 : 0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
