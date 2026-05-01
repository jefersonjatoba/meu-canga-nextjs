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
        className
      )}
      style={{
        background: 'rgba(37,99,235,0.1)',
        border: '1px solid rgba(37,99,235,0.25)',
      }}
    >
      <span className="text-sm text-gray-300">{label ?? 'Valor do RAS'}</span>
      <span className={cn('font-bold text-blue-400', textSizes[size])}>
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
      className={cn('rounded-xl overflow-hidden', className)}
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
            <th className="text-left text-gray-400 font-medium px-4 py-3 text-xs">
              Graduacao / Duração
            </th>
            {RAS_DURACAO_TYPES.map((d) => (
              <th
                key={d}
                className={cn(
                  'text-right font-medium px-4 py-3 text-xs',
                  highlightDuracao === d ? 'text-blue-400' : 'text-gray-400'
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
              style={{
                background:
                  highlightGraduacao === grad
                    ? 'rgba(37,99,235,0.08)'
                    : idx % 2 === 0
                    ? 'rgba(255,255,255,0.02)'
                    : 'transparent',
              }}
            >
              <td
                className={cn(
                  'px-4 py-3 font-medium text-xs whitespace-nowrap',
                  highlightGraduacao === grad ? 'text-blue-300' : 'text-gray-300'
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
                      isHighlighted ? 'text-emerald-400' : 'text-gray-400'
                    )}
                    style={
                      isHighlighted
                        ? { background: 'rgba(16,185,129,0.15)' }
                        : {}
                    }
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
