'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { RasLocationPicker } from './RasLocationPicker'
import { RasPriceDisplay } from './RasPriceDisplay'

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

interface RasFormProps {
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
        <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-1">
          <Calendar size={14} />
          Data
        </label>
        <input
          type="date"
          value={values.data}
          onChange={(e) => set('data', e.target.value)}
          required
          className="w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm bg-white dark:bg-[#141414] border border-gray-300 dark:border-white/[0.10]"
        />
      </div>

      {/* Hora Início */}
      <div>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-1">
          <Clock size={14} />
          Hora de Início
        </label>
        <select
          value={values.horaInicio}
          onChange={(e) => set('horaInicio', e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm bg-white dark:bg-[#141414] border border-gray-300 dark:border-white/[0.10]"
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
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Duração</label>
        <div className="grid grid-cols-4 gap-2">
          {RAS_DURACAO_TYPES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set('duracao', d)}
              className={cn(
                'rounded-lg py-2 text-sm font-semibold transition-all',
                values.duracao === d
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/[0.10]'
              )}
            >
              <div>{d}h</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>
                {fmtBRL(getRasPrice(values.graduacao, d))}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          <Clock size={11} className="inline mr-1" />
          Término: {horaFim}
        </p>
      </div>

      {/* Graduação */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Graduação</label>
        <div className="grid grid-cols-2 gap-2">
          {(['SD/CB', 'SGT/SUBTEN'] as GraduacaoRas[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set('graduacao', g)}
              className={cn(
                'rounded-lg py-2 text-sm font-medium transition-all',
                values.graduacao === g
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/[0.10]'
              )}
            >
              {RAS_GRADUACAO_LABELS[g]}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo + Vaga */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Tipo</label>
          <div className="grid grid-cols-2 gap-1">
            {(['voluntario', 'compulsorio'] as TipoRas[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('tipo', t)}
                className={cn(
                  'rounded-lg py-1.5 text-xs font-medium transition-all',
                  values.tipo === t
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/[0.10]'
                )}
              >
                {t === 'voluntario' ? '✅ Vol' : '⚡ Comp'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Vaga</label>
          <div className="grid grid-cols-2 gap-1">
            {(['titular', 'reserva'] as TipoVagaRas[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => set('tipoVaga', v)}
                className={cn(
                  'rounded-lg py-1.5 text-xs font-medium transition-all',
                  values.tipoVaga === v
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/[0.10]'
                )}
              >
                {v === 'titular' ? '★ Tit' : '🎭 Res'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Local */}
      <div>
        <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
          <MapPin size={14} />
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
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
          Observações <span className="text-gray-500 dark:text-gray-500">(opcional)</span>
        </label>
        <textarea
          value={values.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-lg px-3 py-2 text-gray-900 dark:text-white resize-none text-sm bg-white dark:bg-[#141414] border border-gray-300 dark:border-white/[0.10]"
        />
      </div>

      {/* Preço Preview */}
      <RasPriceDisplay
        graduacao={values.graduacao}
        duracao={values.duracao}
        label="Valor do RAS"
      />

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-medium text-sm border border-gray-300 dark:border-white/[0.10] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm disabled:opacity-60 hover:shadow-lg transition-all"
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
