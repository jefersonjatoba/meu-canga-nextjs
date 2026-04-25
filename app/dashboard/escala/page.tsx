'use client'

import * as React from 'react'
import { LayoutList, CalendarDays, SlidersHorizontal, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import {
  EscalaForm,
  EscalaTable,
  EscalaCalendar,
  EscalaStats,
  EscalaDayModal,
} from '@/components/escala'
import { useEscalaList } from '@/hooks/useEscala'
import type { Escala, TipoTurno, StatusEscala, EscalaFilters } from '@/types/escala'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentMesBR(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).slice(0, 7) // yyyy-MM
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'agendada', label: 'Agendadas' },
  { value: 'realizada', label: 'Realizadas' },
  { value: 'cancelada', label: 'Canceladas' },
]

const TURNO_OPTIONS = [
  { value: 'all', label: 'Todos os turnos' },
  { value: 'MATUTINO', label: 'Matutino (06–14h)' },
  { value: 'VESPERTINO', label: 'Vespertino (14–22h)' },
  { value: 'NOTURNO', label: 'Noturno (22–06h)' },
]

// ─── Filter panel ─────────────────────────────────────────────────────────────

interface FilterState {
  mes: string
  status: 'all' | StatusEscala
  tipoTurno: 'all' | TipoTurno
  localServico: string
}

interface FilterPanelProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  onReset: () => void
}

function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const hasActive =
    filters.status !== 'all' ||
    filters.tipoTurno !== 'all' ||
    filters.localServico !== ''

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Month */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Mês
        </label>
        <input
          type="month"
          value={filters.mes}
          onChange={(e) => onChange({ ...filters, mes: e.target.value })}
          className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          aria-label="Filtrar por mês"
        />
      </div>

      {/* Status */}
      <div className="w-44">
        <Select
          label=""
          options={STATUS_OPTIONS}
          value={filters.status}
          onValueChange={(v) =>
            onChange({ ...filters, status: v as FilterState['status'] })
          }
          placeholder="Status"
        />
      </div>

      {/* Turno */}
      <div className="w-52">
        <Select
          label=""
          options={TURNO_OPTIONS}
          value={filters.tipoTurno}
          onValueChange={(v) =>
            onChange({ ...filters, tipoTurno: v as FilterState['tipoTurno'] })
          }
          placeholder="Turno"
        />
      </div>

      {/* Local */}
      <div className="w-48">
        <Input
          placeholder="Buscar por local..."
          value={filters.localServico}
          onChange={(e) => onChange({ ...filters, localServico: e.target.value })}
          aria-label="Buscar por local de serviço"
        />
      </div>

      {/* Reset */}
      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<X size={14} />}
          aria-label="Limpar filtros"
        >
          Limpar
        </Button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'calendar'

const DEFAULT_FILTERS: FilterState = {
  mes: currentMesBR(),
  status: 'all',
  tipoTurno: 'all',
  localServico: '',
}

export default function EscalaPage() {
  const [view, setView] = React.useState<ViewMode>('table')
  const [filters, setFilters] = React.useState<FilterState>(DEFAULT_FILTERS)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [editingEscala, setEditingEscala] = React.useState<Escala | null>(null)
  const [showFilters, setShowFilters] = React.useState(false)
  const [dayModal, setDayModal] = React.useState<{
    date: string
    escalas: Escala[]
  } | null>(null)

  // Build query filters
  const queryFilters = React.useMemo<EscalaFilters>(
    () => ({
      mes: filters.mes,
      status: filters.status,
      tipoTurno: filters.tipoTurno,
      localServico: filters.localServico || undefined,
      page,
      pageSize,
    }),
    [filters, page, pageSize]
  )

  const { data, isLoading, error } = useEscalaList(queryFilters)

  // Reset to page 1 when filters change (done inside handleFiltersChange to avoid effect cascade)

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f)
    setPage(1)
  }

  const handleEdit = (escala: Escala) => {
    setEditingEscala(escala)
    // On mobile, scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormSuccess = () => {
    setEditingEscala(null)
  }

  const handleCalendarDayClick = (date: string, escalas: Escala[]) => {
    setDayModal({ date, escalas })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Escala de Trabalho
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie seus turnos e visualize sua agenda
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters toggle */}
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            leftIcon={<SlidersHorizontal size={15} />}
            aria-pressed={showFilters}
            aria-label="Mostrar/ocultar filtros"
          >
            Filtros
          </Button>

          {/* View toggle */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            role="radiogroup"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              role="radio"
              aria-checked={view === 'table'}
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === 'table'
                  ? 'bg-white dark:bg-[#1E1E1E] shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutList size={14} aria-hidden />
              Lista
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={view === 'calendar'}
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === 'calendar'
                  ? 'bg-white dark:bg-[#1E1E1E] shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <CalendarDays size={14} aria-hidden />
              Calendário
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <EscalaStats mes={filters.mes} />

      {/* Filters panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={handleFiltersChange}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400"
        >
          Erro ao carregar escalas: {error.message}
        </div>
      )}

      {/* Main layout: content + form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: table or calendar */}
        <div className="min-w-0">
          {view === 'table' ? (
            <EscalaTable
              escalas={data?.escalas ?? []}
              total={data?.total ?? 0}
              page={page}
              pageSize={pageSize}
              isLoading={isLoading}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
              onEdit={handleEdit}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <EscalaCalendar
                  escalas={data?.escalas ?? []}
                  isLoading={isLoading}
                  mes={filters.mes}
                  onMesChange={(m) => setFilters((f) => ({ ...f, mes: m }))}
                  onDayClick={handleCalendarDayClick}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: form */}
        <aside aria-label="Formulário de escala">
          <EscalaForm
            editingEscala={editingEscala}
            onSuccess={handleFormSuccess}
            onCancel={editingEscala ? () => setEditingEscala(null) : undefined}
          />
        </aside>
      </div>

      {/* Calendar day modal */}
      {dayModal && (
        <EscalaDayModal
          date={dayModal.date}
          escalas={dayModal.escalas}
          open={!!dayModal}
          onClose={() => setDayModal(null)}
          onEdit={(e) => {
            handleEdit(e)
            setDayModal(null)
          }}
        />
      )}
    </div>
  )
}
