'use client'

import React from 'react'
import { Edit2, Trash2, CheckCircle, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  fmtBRL,
} from '@/types/ras'
import type { RasAgenda, StatusRas } from '@/types/ras'
import { RasStatusBadge } from './RasStatusBadge'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateToBR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// ─── Table Component ─────────────────────────────────────────────────────────

interface RasTableAction {
  label: string
  icon?: React.ReactNode
  onClick: (ras: RasAgenda) => void
  isAllowed: (ras: RasAgenda) => boolean
  style?: React.CSSProperties
}

interface RasTableProps {
  rasList: RasAgenda[]
  isLoading?: boolean
  emptyMessage?: string
  onEdit?: (ras: RasAgenda) => void
  onDelete?: (ras: RasAgenda) => void
  onConfirmar?: (ras: RasAgenda) => void
  onRealizar?: (ras: RasAgenda) => void
  onPagamento?: (ras: RasAgenda) => void
  extraActions?: RasTableAction[]
  className?: string
  compact?: boolean
}

export function RasTable({
  rasList,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado',
  onEdit,
  onDelete,
  onConfirmar,
  onRealizar,
  onPagamento,
  extraActions = [],
  className,
  compact = false,
}: RasTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-lg animate-pulse"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl overflow-x-auto', className)}
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <table className="w-full text-sm" style={{ minWidth: compact ? 480 : 700 }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
            <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs whitespace-nowrap">
              Data
            </th>
            {!compact && (
              <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">
                Início
              </th>
            )}
            <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">
              Dur.
            </th>
            {!compact && (
              <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">
                Tipo
              </th>
            )}
            {!compact && (
              <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">
                Grad.
              </th>
            )}
            <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">
              Local
            </th>
            <th className="text-right text-gray-400 font-medium px-3 py-3 text-xs whitespace-nowrap">
              Valor
            </th>
            <th className="text-center text-gray-400 font-medium px-3 py-3 text-xs">
              Status
            </th>
            <th className="text-center text-gray-400 font-medium px-3 py-3 text-xs">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rasList.length === 0 ? (
            <tr>
              <td
                colSpan={compact ? 5 : 9}
                className="text-center text-gray-500 py-10 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rasList.map((r, idx) => {
              const isVol = r.tipo === 'voluntario'
              const isTitular = r.tipoVaga === 'titular'

              const canEdit =
                onEdit && (r.status === 'agendado')
              const canDelete =
                onDelete &&
                r.status !== 'confirmado' &&
                r.status !== 'cancelado'
              const canConfirmar =
                onConfirmar &&
                (r.status === 'realizado' || r.status === 'pendente')
              const canRealizar = onRealizar && r.status === 'agendado'
              const canPagamento =
                onPagamento &&
                (r.status === 'confirmado' || r.status === 'pendente')

              return (
                <tr
                  key={r.id}
                  style={{
                    background:
                      idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  <td className="px-3 py-2.5 text-gray-300 text-xs whitespace-nowrap">
                    {dateToBR(r.data)}
                  </td>
                  {!compact && (
                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                      {r.horaInicio}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-gray-400 text-xs font-medium">
                    {r.duracao}h
                  </td>
                  {!compact && (
                    <td className="px-3 py-2.5 text-xs">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={
                          isVol
                            ? {
                                background: 'rgba(139,92,246,.15)',
                                color: '#a78bfa',
                              }
                            : {
                                background: 'rgba(245,158,11,.15)',
                                color: '#fbbf24',
                              }
                        }
                      >
                        {isVol ? '✋ V' : '⚡ C'} - {isTitular ? 'T' : 'R'}
                      </span>
                    </td>
                  )}
                  {!compact && (
                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                      {r.graduacao}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-gray-300 text-xs max-w-[120px] truncate">
                    {r.local.includes(' - ')
                      ? r.local.split(' - ')[0]
                      : r.local}
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-400 font-medium text-xs whitespace-nowrap">
                    {fmtBRL(r.valorCentavos)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <RasStatusBadge status={r.status as StatusRas} size="sm" />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {canRealizar && (
                        <ActionButton
                          onClick={() => onRealizar!(r)}
                          color="#22c55e"
                          bg="rgba(34,197,94,.15)"
                          title="Marcar realizado"
                        >
                          <CheckCircle size={11} />
                        </ActionButton>
                      )}
                      {canConfirmar && (
                        <ActionButton
                          onClick={() => onConfirmar!(r)}
                          color="#10b981"
                          bg="rgba(16,185,129,.15)"
                          title="Confirmar"
                        >
                          🔒
                        </ActionButton>
                      )}
                      {canPagamento && (
                        <ActionButton
                          onClick={() => onPagamento!(r)}
                          color="#f59e0b"
                          bg="rgba(245,158,11,.15)"
                          title="Registrar pagamento"
                        >
                          <DollarSign size={11} />
                        </ActionButton>
                      )}
                      {canEdit && (
                        <ActionButton
                          onClick={() => onEdit!(r)}
                          color="#60a5fa"
                          bg="rgba(96,165,250,.15)"
                          title="Editar"
                        >
                          <Edit2 size={11} />
                        </ActionButton>
                      )}
                      {canDelete && (
                        <ActionButton
                          onClick={() => onDelete!(r)}
                          color="#f87171"
                          bg="rgba(239,68,68,.15)"
                          title="Cancelar"
                        >
                          <Trash2 size={11} />
                        </ActionButton>
                      )}
                      {extraActions.map((a) =>
                        a.isAllowed(r) ? (
                          <button
                            key={a.label}
                            onClick={() => a.onClick(r)}
                            title={a.label}
                            className="px-2 py-0.5 rounded text-[10px] transition-opacity hover:opacity-80"
                            style={a.style}
                          >
                            {a.icon ?? a.label}
                          </button>
                        ) : null
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Action Button (internal) ─────────────────────────────────────────────────

function ActionButton({
  children,
  onClick,
  color,
  bg,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  color: string
  bg: string
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 rounded flex items-center justify-center transition-opacity hover:opacity-80"
      style={{ color, background: bg }}
    >
      {children}
    </button>
  )
}

export default RasTable
