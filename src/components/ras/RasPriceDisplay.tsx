'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { getRasPrice, fmtBRL, RAS_PRICE_TABLE, RAS_DURACAO_TYPES } from '@/types/ras'
import type { GraduacaoRas, DuracaoRas } from '@/types/ras'

// ─── Single Price Display ─────────────────────────────────────────────────────

interface RasPriceDisplayProps {
  graduacao: GraduacaoRas
  duracao: DuracaoRas
  size?: 'sm' | 'md' | 'lg'
  label?: React.ReactNode
  className?: string
}

export function RasPriceDisplay({
  graduacao,
  duracao,
  size = 'md',
  label,
  className,
}: RasPriceDisplayProps) {
  const valorCentavos = getRasPrice(graduacao, duracao)
  const formattedValue = fmtBRL(valorCentavos)

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  return (
    <div
      className={cn(
        'rounded-xl p-3 flex items-center justify-between',
        'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/40',
        className
      )}
    >
      <span className="text-sm text-gray-700 dark:text-gray-300">{label ?? 'Valor do RAS'}</span>
      <span className={cn('font-bold text-blue-600 dark:text-blue-400', textSizes[size])}>
        {formattedValue}
      </span>
    </div>
  )
}

// ─── Full Price Table ─────────────────────────────────────────────────────────

interface RasPriceTableProps {
  highlightGraduacao?: GraduacaoRas
  highlightDuracao?: DuracaoRas
  className?: string
}

export function RasPriceTable({
  highlightGraduacao,
  highlightDuracao,
  className,
}: RasPriceTableProps) {
  const graduacoes = Object.keys(RAS_PRICE_TABLE) as GraduacaoRas[]

  return (
    <div
      className={cn('rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/60', className)}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <th className="text-left text-gray-700 dark:text-gray-300 font-medium px-4 py-3 text-xs">
              Graduacao / Duração
            </th>
            {RAS_DURACAO_TYPES.map((d) => (
              <th
                key={d}
                className={cn(
                  'text-right font-medium px-4 py-3 text-xs',
                  highlightDuracao === d ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {d}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {graduacoes.map((grad, idx) => (
            <tr
              key={grad}
              className={cn(
                highlightGraduacao === grad
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : idx % 2 === 0
                  ? 'bg-gray-50 dark:bg-gray-800/30'
                  : 'bg-white dark:bg-gray-900/50'
              )}
            >
              <td
                className={cn(
                  'px-4 py-3 font-medium text-xs whitespace-nowrap',
                  highlightGraduacao === grad ? 'text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {grad}
              </td>
              {RAS_DURACAO_TYPES.map((d) => {
                const isHighlighted =
                  highlightGraduacao === grad && highlightDuracao === d
                return (
                  <td
                    key={d}
                    className={cn(
                      'px-4 py-3 text-right text-xs font-semibold',
                      isHighlighted
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {fmtBRL(getRasPrice(grad, d))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RasPriceDisplay
