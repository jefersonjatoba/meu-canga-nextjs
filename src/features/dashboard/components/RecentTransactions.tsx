'use client'

import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import { TIPO_LABELS } from '@/features/lancamentos/types'
import type { RecentTransactionItem } from '@/features/dashboard/types'
import type { TipoLancamento } from '@/features/lancamentos/types'

type IconComponent = React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>
type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'earlier'

const tipoIcon: Record<TipoLancamento, IconComponent> = {
  income:             ArrowDownLeft,
  expense:            ArrowUpRight,
  ras:                Shield,
  investment_aporte:  TrendingUp,
  investment_resgate: TrendingDown,
  transfer:           ArrowLeftRight,
}

const tipoIconStyle: Record<TipoLancamento, string> = {
  income:             'bg-green-100 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400',
  expense:            'bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400',
  ras:                'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  investment_aporte:  'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  investment_resgate: 'bg-purple-50 dark:bg-purple-500/[0.07] text-purple-400 dark:text-purple-300',
  transfer:           'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400',
}

const tipoValueStyle: Record<TipoLancamento, string> = {
  income:             'text-green-600 dark:text-emerald-400',
  expense:            'text-red-500 dark:text-red-400',
  ras:                'text-blue-600 dark:text-blue-400',
  investment_aporte:  'text-purple-600 dark:text-purple-400',
  investment_resgate: 'text-purple-400 dark:text-purple-300',
  transfer:           'text-gray-500 dark:text-gray-400',
}

const tipoSign: Record<TipoLancamento, string> = {
  income:             '+',
  expense:            '−',
  ras:                '+',
  investment_aporte:  '−',
  investment_resgate: '+',
  transfer:           '',
}

interface RecentTransactionsProps {
  items: RecentTransactionItem[]
}

function getDateGroup(itemDate: Date | string): DateGroup {
  const date = typeof itemDate === 'string' ? new Date(itemDate) : itemDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - today.getDay())

  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)

  if (checkDate.getTime() === today.getTime()) return 'today'
  if (checkDate.getTime() === yesterday.getTime()) return 'yesterday'
  if (checkDate >= weekStart && checkDate < today) return 'thisWeek'
  return 'earlier'
}

function getGroupLabel(group: DateGroup, date: Date | string): string {
  if (group === 'today') return 'Hoje'
  if (group === 'yesterday') return 'Ontem'
  if (group === 'thisWeek') return 'Esta Semana'
  return formatDateBR(date)
}

function groupTransactions(items: RecentTransactionItem[]): Map<DateGroup, RecentTransactionItem[]> {
  const grouped = new Map<DateGroup, RecentTransactionItem[]>()

  for (const item of items) {
    const group = getDateGroup(item.data)
    if (!grouped.has(group)) {
      grouped.set(group, [])
    }
    grouped.get(group)!.push(item)
  }

  return grouped
}

function calculateGroupBalance(items: RecentTransactionItem[]): number {
  return items.reduce((acc, item) => {
    if (item.tipo === 'income' || item.tipo === 'ras' || item.tipo === 'investment_resgate') {
      return acc + item.valorCentavos
    } else {
      return acc - item.valorCentavos
    }
  }, 0)
}

function TransactionItem({ item }: { item: RecentTransactionItem }) {
  const Icon = tipoIcon[item.tipo] ?? ArrowLeftRight

  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/[0.05] last:border-b-0">
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          tipoIconStyle[item.tipo] ?? tipoIconStyle.transfer,
        )}
      >
        <Icon size={16} aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          {item.descricao}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDateBR(item.data)}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-400" aria-hidden>
            ·
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {TIPO_LABELS[item.tipo] ?? item.tipo}
          </span>
          {item.categoria && (
            <>
              <span className="text-xs text-gray-300 dark:text-gray-400" aria-hidden>
                ·
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {item.categoria}
              </span>
            </>
          )}
        </div>
      </div>

      <span
        className={cn(
          'text-sm font-semibold tabular-nums shrink-0',
          tipoValueStyle[item.tipo] ?? 'text-gray-700 dark:text-gray-200',
        )}
      >
        {tipoSign[item.tipo] ?? ''}{formatBRL(item.valorCentavos)}
      </span>
    </div>
  )
}

function TransactionGroup({
  label,
  items,
  balance
}: {
  label: string
  items: RecentTransactionItem[]
  balance: number
}) {
  const [expanded, setExpanded] = useState(true)
  const visibleItems = expanded ? items : items.slice(0, 3)
  const hasMore = items.length > 3 && !expanded

  return (
    <div className="border-b border-gray-100 dark:border-white/[0.05] last:border-b-0">
      <div className="px-5 py-3 bg-gray-50 dark:bg-white/[0.02] flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {label}
        </h3>
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          balance >= 0
            ? 'text-green-600 dark:text-emerald-400'
            : 'text-red-500 dark:text-red-400'
        )}>
          {balance >= 0 ? '+' : '−'}{formatBRL(Math.abs(balance))}
        </span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {visibleItems.map(item => (
          <TransactionItem key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-5 py-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-white/[0.05] transition-colors"
        >
          Ver mais {items.length - 3} movimentações
          <ChevronDown size={14} aria-hidden />
        </button>
      )}
    </div>
  )
}

export function RecentTransactions({ items }: RecentTransactionsProps) {
  const grouped = groupTransactions(items)
  const groupOrder: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'earlier']

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Lançamentos Recentes
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {items.length === 1
              ? '1 movimentação mais recente'
              : `${items.length} movimentações mais recentes`}{' '}
            no período
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {groupOrder.map(group => {
          const groupItems = grouped.get(group)
          if (!groupItems || groupItems.length === 0) return null

          const balance = calculateGroupBalance(groupItems)
          const label = getGroupLabel(group, groupItems[0]!.data)

          return (
            <TransactionGroup
              key={group}
              label={label}
              items={groupItems}
              balance={balance}
            />
          )
        })}
      </div>
    </div>
  )
}
