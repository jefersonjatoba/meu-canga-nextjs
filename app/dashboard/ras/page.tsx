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
  RasSidebar,
} from '@/features/ras/components'
import {
  fetchRas,
  fetchRasStats,
  cancelarRas,
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
  const [rasAgendas,  setRasAgendas]  = useState<RasAgenda[]>([])
  const [stats,       setStats]       = useState<RasMonthStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editingRas,  setEditingRas]  = useState<RasAgenda | null>(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter,    setStatusFilter]    = useState<string>('all')
  const [graduacaoFilter, setGraduacaoFilter] = useState<string>('all')
  const [localFilter,     setLocalFilter]     = useState<string>('')

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listResult, statsResult] = await Promise.all([
        fetchRas({
          competencia,
          status:    statusFilter    !== 'all' ? statusFilter    : undefined,
          graduacao: graduacaoFilter !== 'all' ? graduacaoFilter : undefined,
          local:     localFilter || undefined,
          pageSize:  100,
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
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
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
      await cancelarRas(id)
      setLoading(true)
      await new Promise(r => setTimeout(r, 300))
      await loadData()
    } catch (err) {
      setLoading(false)
      alert(err instanceof Error ? err.message : 'Erro ao cancelar RAS')
    }
  }

  const handleMarcarRealizado = async (id: string) => {
    try {
      await marcarRealizado(id)
      setLoading(true)
      await new Promise(r => setTimeout(r, 300))
      await loadData()
    } catch (err) {
      setLoading(false)
      alert(err instanceof Error ? err.message : 'Erro ao marcar como realizado')
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  // Na aba cancelados queremos ver os cancelados; nas demais, escondemos eles
  const isReadOnly = statusFilter === 'cancelado'
  const activeRas  = isReadOnly
    ? rasAgendas
    : rasAgendas.filter((r) => r.status !== 'cancelado')
  const isEmpty    = !loading && activeRas.length === 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header: título + navMês + progresso de horas */}
      <RasHeader
        competencia={competencia}
        onCompetenciaChange={setCompetencia}
        stats={stats}
        onNovoClick={handleNovoClick}
      />

      {/* Two-column layout: conteúdo principal + sidebar (desktop) */}
      <div className="lg:grid lg:grid-cols-[1fr_272px] lg:gap-5 lg:items-start">

        {/* ── Coluna principal ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Filtros de status (chips) + graduação/local (selects) */}
          <RasFilters
            status={statusFilter}
            onStatusChange={setStatusFilter}
            graduacao={graduacaoFilter}
            onGraduacaoChange={setGraduacaoFilter}
            local={localFilter}
            onLocalChange={setLocalFilter}
          />

          {/* Error */}
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

          {/* Loading */}
          {loading && !error && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#1E1E1E] shadow-sm">
              <div className="px-5 py-10 flex flex-col items-center gap-3 text-gray-400">
                <Loader2 size={24} className="animate-spin" aria-hidden />
                <p className="text-sm">Carregando…</p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && isEmpty && (
            <RasEmptyState onNovoClick={handleNovoClick} />
          )}

          {/* Lista */}
          {!loading && !error && !isEmpty && (
            <RasList
              rasAgendas={activeRas}
              isLoading={false}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarcarRealizado={handleMarcarRealizado}
              isReadOnly={isReadOnly}
            />
          )}

          {/* Charts — mobile only (desktop fica na sidebar) */}
          {!loading && !error && !isEmpty && stats && (
            <div className="lg:hidden">
              <RasCharts stats={stats} />
            </div>
          )}
        </div>

        {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
        <RasSidebar stats={stats} />
      </div>

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
