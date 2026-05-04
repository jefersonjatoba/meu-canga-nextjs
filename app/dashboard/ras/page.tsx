'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import {
  RasHeader,
  RasFilters,
  RasList,
  RasModal,
  RasEmptyState,
  RasCharts,
} from '@/features/ras/components'
import {
  fetchRas,
  fetchRasStats,
  deleteRas,
  marcarRealizado,
} from '@/features/ras/api'
import type { RasAgenda, RasMonthStats } from '@/types/ras'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentCompetencia(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RasPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [competencia, setCompetencia] = useState<string>(currentCompetencia)
  const [rasAgendas, setRasAgendas] = useState<RasAgenda[]>([])
  const [stats, setStats] = useState<RasMonthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRas, setEditingRas] = useState<RasAgenda | null>(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [graduacaoFilter, setGraduacaoFilter] = useState<string>('all')
  const [localFilter, setLocalFilter] = useState<string>('')

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listResult, statsResult] = await Promise.all([
        fetchRas({
          competencia,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          graduacao: graduacaoFilter !== 'all' ? graduacaoFilter : undefined,
          local: localFilter || undefined,
          pageSize: 100,
        }),
        fetchRasStats(competencia),
      ])
      setRasAgendas(listResult.rasAgendas)
      setStats(statsResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [competencia, statusFilter, graduacaoFilter, localFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNovoClick = () => {
    setEditingRas(null)
    setModalOpen(true)
  }

  const handleEdit = (ras: RasAgenda) => {
    setEditingRas(ras)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Cancelar este RAS?')) return
    try {
      await deleteRas(id)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar RAS')
    }
  }

  const handleMarcarRealizado = async (id: string) => {
    try {
      await marcarRealizado(id)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao marcar como realizado')
    }
  }

  // ── Active list (excluindo cancelados) ────────────────────────────────────
  const activeRas = rasAgendas.filter((r) => r.status !== 'cancelado')
  const isEmpty = !loading && activeRas.length === 0

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <RasHeader
        competencia={competencia}
        stats={stats}
        onNovoClick={handleNovoClick}
      />

      {/* Filters */}
      <RasFilters
        competencia={competencia}
        onCompetenciaChange={setCompetencia}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        graduacao={graduacaoFilter}
        onGraduacaoChange={setGraduacaoFilter}
        local={localFilter}
        onLocalChange={setLocalFilter}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-5 py-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => void loadData()}
            className="mt-3 text-sm text-red-600 dark:text-red-400 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm">
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin" aria-hidden />
            <p className="text-sm">Carregando…</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && isEmpty && (
        <RasEmptyState onNovoClick={handleNovoClick} />
      )}

      {/* Content */}
      {!loading && !error && !isEmpty && (
        <>
          <RasList
            rasAgendas={activeRas}
            isLoading={false}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarcarRealizado={handleMarcarRealizado}
          />
          {stats && <RasCharts stats={stats} />}
        </>
      )}

      {/* Modal */}
      <RasModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        initial={editingRas}
        competencia={competencia}
        onSaved={loadData}
      />
    </div>
  )
}
