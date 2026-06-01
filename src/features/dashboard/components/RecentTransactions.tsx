'use client'

import type { ComponentType } from 'react'
import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBRL } from '@/lib/money'
import { formatDateBR } from '@/lib/dates'
import { TIPO_LABELS } from '@/features/lancamentos/types'
import type { RecentTransactionItem } from '@/features/dashboard/types'
import type { TipoLancamento } from '@/features/lancamentos/types'

type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' }>
type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'earlier'

const tipoIcon: Record<TipoLancamento, IconComponent> = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  ras: Shield,
  investment_aporte: TrendingUp,
  investment_resgate: TrendingDown,
  transfer: ArrowLeftRight,
}

const tipoIconStyle: Record<TipoLancamento, string> = {
  income: 'bg-green-100 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400',
  expense: 'bg-red-100 dark:bg-red-500/10 text-red-500 dark:text-red-400',
  ras: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  investment_aporte: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  investment_resgate: 'bg-purple-50 dark:bg-purple-500/[0.07] text-purple-400 dark:text-purple-300',
  transfer: 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400',
}

const tipoValueStyle: Record<TipoLancamento, string> = {
  income: 'text-green-600 dark:text-emerald-400',
  expense: 'text-red-500 dark:text-red-400',
  ras: 'text-blue-600 dark:text-blue-400',
  investment_aporte: 'text-purple-600 dark:text-purple-400',
  investment_resgate: 'text-purple-400 dark:text-purple-300',
  transfer: 'text-gray-500 dark:text-gray-400',
}

const tipoSign: Record<TipoLancamento, string> = {
  income: '+',
  expense: '−',
  ras: '+',
  investment_aporte: '−',
  investment_resgate: '+',
  transfer: '',
}

interface RecentTransactionsProps {
  items: RecentTransactionItem[]
}

function getDateGroup(itemDate: Date | string): DateGroup {
  const dateStr = typeof itemDate === 'string' ? itemDate.slice(0, 10) : itemDate.toISOString().slice(0, 10)
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

  const checkDate = new Date(`${dateStr}T00:00:00Z`)
  const today = new Date(`${todayStr}T00:00:00Z`)
  const yesterday = new Date(today)
  yesterday.setUTCDate(today.getUTCDate() - 1)
  const weekStart = new Date(today)
  weekStart.setUTCDate(today.getUTCDate() - today.getUTCDay())

  if (checkDate.getTime() === today.getTime()) return 'today'
  if (checkDate.getTime() === yesterday.getTime()) return 'yesterday'
  if (checkDate >= weekStart && checkDate < today) return 'thisWeek'
  return 'earlier'
}

function getGroupLabel(group: DateGroup, date: Date | string): string {
  if (group === 'today') return 'Hoje'
  if (group === 'yesterday') return 'Ontem'
  if (group === 'thisWeek') return 'Esta semana'
  return formatDateBR(date)
}

function groupTransactions(items: RecentTransactionItem[]): Map<DateGroup, RecentTransactionItem[]> {
  const grouped = new Map<DateGroup, RecentTransactionItem[]>()

  for (const item of items) {
    const group = getDateGroup(item.data)
    if (!grouped.has(group)) grouped.set(group, [])
    grouped.get(group)!.push(item)
  }

  return grouped
}

function calculateGroupBalance(items: RecentTransactionItem[]): number {
  return items.reduce((acc, item) => {
    if (item.tipo === 'income' || item.tipo === 'ras' || item.tipo === 'investment_resgate') {
      return acc + item.valorCentavos
    }
    return acc - item.valorCentavos
  }, 0)
}

function TransactionItem({ item }: { item: RecentTransactionItem }) {
  const Icon = tipoIcon[item.tipo] ?? ArrowLeftRight

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 dark:border-white/[0.05]">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          tipoIconStyle[item.tipo] ?? tipoIconStyle.transfer,
        )}
      >
        <Icon size={16} aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item.descricao}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDateBR(item.data)}</span>
          <span className="text-xs text-gray-300 dark:text-gray-400" aria-hidden>
            ·
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{TIPO_LABELS[item.tipo] ?? item.tipo}</span>
          {item.categoria && (
            <>
              <span className="text-xs text-gray-300 dark:text-gray-400" aria-hidden>
                ·
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{item.categoria}</span>
            </>
          )}
        </div>
      </div>

      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          tipoValueStyle[item.tipo] ?? 'text-gray-700 dark:text-gray-200',
        )}
      >
        {tipoSign[item.tipo] ?? ''}
        {formatBRL(item.valorCentavos)}
      </span>
    </div>
  )
}

function TransactionGroup({
  label,
  items,
  balance,
}: {
  label: string
  items: RecentTransactionItem[]
  balance: number
}) {
  const [expanded, setExpanded] = useState(true)
  const visibleItems = expanded ? items : items.slice(0, 3)
  const hasMore = items.length > 3 && !expanded

  return (
    <div className="border-b border-gray-100 last:border-b-0 dark:border-white/[0.05]">
      <div className="flex items-center justify-between bg-gray-50 px-5 py-3 dark:bg-white/[0.02]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">{label}</h3>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            balance >= 0 ? 'text-green-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
          )}
        >
          {balance >= 0 ? '+' : '−'}
          {formatBRL(Math.abs(balance))}
        </span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {visibleItems.map((item) => (
          <TransactionItem key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 px-5 py-3 text-xs font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:border-white/[0.05] dark:text-blue-400 dark:hover:bg-white/[0.02]"
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Lançamentos recentes</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {items.length === 1 ? '1 movimentação recente' : `${items.length} movimentações recentes`} no período
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {groupOrder.map((group) => {
          const groupItems = grouped.get(group)
          if (!groupItems || groupItems.length === 0) return null

          const balance = calculateGroupBalance(groupItems)
          const label = getGroupLabel(group, groupItems[0]!.data)

          return <TransactionGroup key={group} label={label} items={groupItems} balance={balance} />
        })}
      </div>
    </div>
  )
}
