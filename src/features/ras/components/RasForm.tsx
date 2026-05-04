'use client'

import React, { useState, useCallback } from 'react'
import { Clock, MapPin, Calendar, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getRasPrice,
  fmtBRL,
  RAS_DURACAO_TYPES,
  RAS_GRADUACAO_LABELS,
} from '@/types/ras'
import type {
  RasAgenda,
  GraduacaoRas,
  DuracaoRas,
  TipoRas,
  TipoVagaRas,
  CreateRasAgendaInput,
} from '@/types/ras'
import { RasLocationPicker } from '@/components/ras/RasLocationPicker'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcHoraFim(horaInicio: string, duracao: number): string {
  const [h, m] = horaInicio.split(':').map(Number)
  const totalMin = h * 60 + m + duracao * 60
  const fh = Math.floor(totalMin / 60) % 24
  const fm = totalMin % 60
  return `${String(fh).padStart(2, '0')}:${String(fm).padStart(2, '0')}`
}

function getCompetencia(dateStr: string): string {
  return dateStr.length >= 7 ? dateStr.slice(0, 7) : ''
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RasFormValues {
  data: string
  horaInicio: string
  duracao: DuracaoRas
  graduacao: GraduacaoRas
  tipo: TipoRas
  tipoVaga: TipoVagaRas
  local: string
  observacoes: string
}

export interface RasFormProps {
  /** Existing RAS being edited; null/undefined = create mode */
  initial?: RasAgenda | null
  /** Default date to prefill (yyyy-MM-dd) */
  prefillDate?: string
  /** Default competencia (yyyy-MM) — used when no date is prefilled */
  defaultCompetencia?: string
  onSubmit: (values: CreateRasAgendaInput) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
  className?: string
}

// ─── Toggle Button ────────────────────────────────────────────────────────────

function ToggleButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg py-2 text-sm font-medium transition-all',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
        className
      )}
    >
      {children}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasForm({
  initial,
  prefillDate,
  defaultCompetencia,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  className,
}: RasFormProps) {
  const savedGrad =
    typeof window !== 'undefined'
      ? (localStorage.getItem('ras_graduacao') as GraduacaoRas | null)
      : null

  const [values, setValues] = useState<RasFormValues>({
    data: initial ? initial.data.slice(0, 10) : (prefillDate ?? ''),
    horaInicio: initial?.horaInicio ?? '07:00',
    duracao: (initial?.duracao as DuracaoRas) ?? 12,
    graduacao: (initial?.graduacao as GraduacaoRas) ?? savedGrad ?? 'SD/CB',
    tipo: (initial?.tipo as TipoRas) ?? 'voluntario',
    tipoVaga: (initial?.tipoVaga as TipoVagaRas) ?? 'titular',
    local: initial?.local ?? '',
    observacoes: initial?.observacoes ?? '',
  })
  const [validationError, setValidationError] = useState('')

  const set = useCallback(
    <K extends keyof RasFormValues>(key: K, val: RasFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: val }))
    },
    []
  )

  const horaFim = calcHoraFim(values.horaInicio, values.duracao)
  const competencia =
    values.data.length >= 7
      ? getCompetencia(values.data)
      : (defaultCompetencia ?? '')

  const price = getRasPrice(values.graduacao, values.duracao)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError('')

    if (!values.data) return setValidationError('Informe a data do RAS')
    if (!values.local) return setValidationError('Selecione o local')
    if (!competencia)
      return setValidationError('Data inválida — não foi possível calcular a competência')

    try {
      await onSubmit({
        data: values.data,
        horaInicio: values.horaInicio,
        horaFim,
        duracao: values.duracao,
        local: values.local,
        graduacao: values.graduacao,
        tipo: values.tipo,
        tipoVaga: values.tipoVaga,
        competencia,
        observacoes: values.observacoes || undefined,
      })
      localStorage.setItem('ras_graduacao', values.graduacao)
    } catch {
      // Error handled by parent via error prop
    }
  }

  const horaOptions = Array.from({ length: 24 }, (_, i) => {
    const hh = String(i).padStart(2, '0')
    return { value: `${hh}:00`, label: `${hh}:00` }
  })

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Data */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <Calendar size={14} aria-hidden />
          Data
        </label>
        <input
          type="date"
          value={values.data}
          onChange={(e) => set('data', e.target.value)}
          required
          className="w-full rounded-lg px-3 py-2.5 text-sm
            bg-white dark:bg-[#1E1E1E]
            text-gray-900 dark:text-gray-100
            border border-gray-300 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            transition-colors
            [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      {/* Hora Início */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <Clock size={14} aria-hidden />
          Hora de Início
        </label>
        <select
          value={values.horaInicio}
          onChange={(e) => set('horaInicio', e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 text-sm
            bg-white dark:bg-[#1E1E1E]
            text-gray-900 dark:text-gray-100
            border border-gray-300 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            transition-colors"
        >
          {horaOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Duração */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Duração
        </label>
        <div className="grid grid-cols-4 gap-2">
          {RAS_DURACAO_TYPES.map((d) => (
            <ToggleButton
              key={d}
              active={values.duracao === d}
              onClick={() => set('duracao', d)}
            >
              <div className="font-semibold">{d}h</div>
              <div className="text-[10px] opacity-75">
                {fmtBRL(getRasPrice(values.graduacao, d))}
              </div>
            </ToggleButton>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          <Clock size={11} className="inline mr-1" aria-hidden />
          Término previsto: <span className="font-medium">{horaFim}</span>
        </p>
      </div>

      {/* Graduação */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Graduação
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['SD/CB', 'SGT/SUBTEN'] as GraduacaoRas[]).map((g) => (
            <ToggleButton
              key={g}
              active={values.graduacao === g}
              onClick={() => set('graduacao', g)}
            >
              {RAS_GRADUACAO_LABELS[g]}
            </ToggleButton>
          ))}
        </div>
      </div>

      {/* Tipo + Vaga */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Tipo
          </label>
          <div className="grid grid-cols-2 gap-1">
            {(['voluntario', 'compulsorio'] as TipoRas[]).map((t) => (
              <ToggleButton
                key={t}
                active={values.tipo === t}
                onClick={() => set('tipo', t)}
                className="py-1.5 text-xs"
              >
                {t === 'voluntario' ? 'Vol.' : 'Comp.'}
              </ToggleButton>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Vaga
          </label>
          <div className="grid grid-cols-2 gap-1">
            {(['titular', 'reserva'] as TipoVagaRas[]).map((v) => (
              <ToggleButton
                key={v}
                active={values.tipoVaga === v}
                onClick={() => set('tipoVaga', v)}
                className="py-1.5 text-xs"
              >
                {v === 'titular' ? 'Titular' : 'Reserva'}
              </ToggleButton>
            ))}
          </div>
        </div>
      </div>

      {/* Local */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <MapPin size={14} aria-hidden />
          Local
        </label>
        <RasLocationPicker
          value={values.local}
          onChange={(local) => set('local', local)}
          native
        />
      </div>

      {/* Observações */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
          Observações{' '}
          <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
        </label>
        <textarea
          value={values.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-lg px-3 py-2.5 text-sm resize-none
            bg-white dark:bg-[#1E1E1E]
            text-gray-900 dark:text-gray-100
            border border-gray-300 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
            transition-colors"
        />
      </div>

      {/* Preço Preview */}
      <div className="rounded-xl p-3 flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
        <span className="text-sm text-gray-600 dark:text-gray-300">Valor do RAS</span>
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
          {fmtBRL(price)}
        </span>
      </div>

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span role="alert">{displayError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium
              text-gray-600 dark:text-gray-400
              border border-gray-200 dark:border-gray-700
              hover:bg-gray-50 dark:hover:bg-gray-800
              transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold
            bg-blue-600 hover:bg-blue-700 active:bg-blue-800
            text-white transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading
            ? 'Salvando...'
            : initial
            ? 'Salvar Alterações'
            : 'Agendar RAS'}
        </button>
      </div>
    </form>
  )
}

export default RasForm
