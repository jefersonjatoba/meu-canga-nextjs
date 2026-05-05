'use client'

import { Loader2, Pencil, Trash2, CheckCircle } from 'lucide-react'
import {
  fmtBRL,
  RAS_STATUS_LABELS,
  RAS_STATUS_COLORS,
} from '@/types/ras'
import type { RasAgenda, StatusRas } from '@/types/ras'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateToBR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusRas }) {
  const colors = RAS_STATUS_COLORS[status]
  const label = RAS_STATUS_LABELS[status]

  // Map inline colors to Tailwind-friendly approach via style (colors come from domain types)
  return (
    <span
      className="inline-flex items-center rounded-full text-[10px] px-2 py-0.5 font-medium whitespace-nowrap"
      style={{ color: colors.color, background: colors.bg }}
    >
      {label}
    </span>
  )
}

// ─── Tipo Badge ───────────────────────────────────────────────────────────────

function TipoBadge({ tipo, tipoVaga }: { tipo: string; tipoVaga: string }) {
  const isVol = tipo === 'voluntario'
  return (
    <span
      className="inline-flex items-center rounded text-[10px] px-1.5 py-0.5 font-semibold whitespace-nowrap"
      style={
        isVol
          ? { background: 'rgba(139,92,246,.15)', color: '#a78bfa' }
          : { background: 'rgba(245,158,11,.15)', color: '#fbbf24' }
      }
    >
      {isVol ? 'Vol' : 'Comp'} · {tipoVaga === 'titular' ? 'T' : 'R'}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasListProps {
  rasAgendas: RasAgenda[]
  isLoading: boolean
  onEdit: (ras: RasAgenda) => void
  onDelete: (id: string) => void
  onMarcarRealizado: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasList({
  rasAgendas,
  isLoading,
  onEdit,
  onDelete,
  onMarcarRealizado,
}: RasListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm">
        <div className="px-5 py-10 flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" aria-hidden />
          <p className="text-sm">Carregando RAS…</p>
        </div>
      </div>
    )
  }

  if (rasAgendas.length === 0) return null

  const active = rasAgendas.filter((r) => r.status !== 'cancelado')

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1C] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.08] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">RAS do mês</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {active.length} {active.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 720 }}>
          <thead>
            <tr className="bg-gray-50 dark:bg-white/[0.05]">
              <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3 whitespace-nowrap">Data</th>
              <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Hora</th>
              <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Dur.</th>
              <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Tipo</th>
              <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Grad.</th>
              <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Local</th>
              <th className="text-right text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3 whitespace-nowrap">Valor</th>
              <th className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Status</th>
              <th className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {active
              .sort((a, b) => a.data.localeCompare(b.data))
              .map((ras, idx) => {
                const canEdit = ras.status === 'agendado'
                const canDelete = ras.status !== 'confirmado' && ras.status !== 'cancelado'
                const canRealizar = ras.status === 'agendado'

                return (
                  <tr
                    key={ras.id}
                    className={idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-white/[0.05]'}
                  >
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {dateToBR(ras.data)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {ras.horaInicio}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {ras.duracao}h
                    </td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={ras.tipo} tipoVaga={ras.tipoVaga} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {ras.graduacao}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 max-w-[140px] truncate">
                      {ras.local.includes(' - ') ? ras.local.split(' - ')[0] : ras.local}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                      {fmtBRL(ras.valorCentavos)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={ras.status as StatusRas} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {canRealizar && (
                          <ActionIconButton
                            onClick={() => onMarcarRealizado(ras.id)}
                            title="Marcar como realizado"
                            colorClass="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <CheckCircle size={14} aria-hidden />
                          </ActionIconButton>
                        )}
                        {canEdit && (
                          <ActionIconButton
                            onClick={() => onEdit(ras)}
                            title="Editar"
                            colorClass="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Pencil size={14} aria-hidden />
                          </ActionIconButton>
                        )}
                        {canDelete && (
                          <ActionIconButton
                            onClick={() => onDelete(ras.id)}
                            title="Cancelar RAS"
                            colorClass="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={14} aria-hidden />
                          </ActionIconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <ul className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.05]">
        {active
          .sort((a, b) => a.data.localeCompare(b.data))
          .map((ras) => {
            const canRealizar = ras.status === 'agendado'
            const canEdit = ras.status === 'agendado'
            const canDelete = ras.status !== 'confirmado' && ras.status !== 'cancelado'

            return (
              <li key={ras.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {dateToBR(ras.data)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {ras.horaInicio} · {ras.duracao}h
                    </span>
                    <StatusBadge status={ras.status as StatusRas} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {ras.local.includes(' - ') ? ras.local.split(' - ')[0] : ras.local}
                    {' · '}
                    {ras.graduacao}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmtBRL(ras.valorCentavos)}
                  </span>
                  <div className="flex gap-1">
                    {canRealizar && (
                      <ActionIconButton
                        onClick={() => onMarcarRealizado(ras.id)}
                        title="Marcar realizado"
                        colorClass="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <CheckCircle size={14} aria-hidden />
                      </ActionIconButton>
                    )}
                    {canEdit && (
                      <ActionIconButton
                        onClick={() => onEdit(ras)}
                        title="Editar"
                        colorClass="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Pencil size={14} aria-hidden />
                      </ActionIconButton>
                    )}
                    {canDelete && (
                      <ActionIconButton
                        onClick={() => onDelete(ras.id)}
                        title="Cancelar"
                        colorClass="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} aria-hidden />
                      </ActionIconButton>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
      </ul>
    </div>
  )
}

// ─── Action Icon Button (internal) ───────────────────────────────────────────

function ActionIconButton({
  children,
  onClick,
  title,
  colorClass,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  colorClass: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${colorClass}`}
    >
      {children}
    </button>
  )
}
