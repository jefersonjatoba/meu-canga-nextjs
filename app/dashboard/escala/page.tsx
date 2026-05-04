'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/Dialog'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Bell,
  BellOff,
  BarChart3,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  type TipoEscala,
  type TipoTurno,
  type EscalaEntry,
  type EscalaConfig,
  TIPO_TURNO_META,
  TIPO_ESCALA_META,
  LOCAIS_BPM,
  LOCAIS_ESPECIAL,
  LOCAIS_UPP,
  LOCAIS_CPP,
  calcularDias,
  calcularProgresso,
  diasAteProximo,
  horasNoMes,
  formatarData,
  formatarDataCurta,
  formatarMesAno,
  todaySP,
} from '@/lib/escala'

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const TIPO_TURNO_OPTIONS = Object.entries(TIPO_TURNO_META).map(([value, meta]) => ({
  value,
  label: `${meta.emoji} ${meta.label}`,
}))

// Short labels — no parenthetical descriptions
const TIPO_ESCALA_OPTIONS = [
  { value: '24x72',        label: '24×72' },
  { value: '24x48',        label: '24×48' },
  { value: '12x24-12x72', label: '12×24 + 12×72' },
  { value: '12x24-12x48', label: '12×24 + 12×48' },
  { value: '12x36-folgao', label: '12×36 Folgão' },
]

// Full hours only (00h … 23h)
const HORA_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, '0')}:00`,
  label: `${String(i).padStart(2, '0')}h`,
}))

const NONE_LOCAL = '__none__'

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Auto-compute horaFim based on escala type and horaInicio */
function calcHoraFim(tipo: TipoEscala, horaInicio: string): string {
  const h = parseInt(horaInicio.split(':')[0], 10)
  if (tipo === '24x72' || tipo === '24x48') {
    return horaInicio // 24h shift — same hour next day (midnight crossing handled in calcularProgresso)
  }
  return `${String((h + 12) % 24).padStart(2, '0')}:00`
}

/** Returns headers with x-user-id for all API calls.
 *
 * Tenta obter o userId em três níveis (mais rápido → mais lento):
 *  1. getSession() — lê dos cookies/storage local (síncrono, sem rede)
 *  2. getUser()   — valida o token contra o Supabase (faz request)
 *
 * Como o app migrou de createClient (localStorage) para createBrowserClient
 * (cookies), sessões antigas podem não estar nos cookies ainda; getUser()
 * força o supabase-js a hidratar a session a partir de qualquer storage
 * disponível e revalidar o token.
 */
async function getHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  let userId: string | undefined

  const { data: sessionData } = await supabase.auth.getSession()
  userId = sessionData?.session?.user?.id

  if (!userId) {
    const { data: userData } = await supabase.auth.getUser()
    userId = userData?.user?.id
  }

  if (!userId) throw new Error('Usuário não autenticado')
  return { 'x-user-id': userId, ...extra }
}

// ─── Helper: get background color class by shift type ────────────────────────

function getShiftBg(tipo: TipoTurno): string {
  const map: Record<TipoTurno, string> = {
    plantao:    'bg-blue-500',
    sobreaviso: 'bg-amber-500',
    extra:      'bg-purple-500',
    ferias:     'bg-green-500',
    folga:      'bg-gray-400',
  }
  return map[tipo] ?? 'bg-gray-400'
}

function getShiftBgLight(tipo: TipoTurno): string {
  const map: Record<TipoTurno, string> = {
    plantao:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    sobreaviso: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    extra:      'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    ferias:     'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    folga:      'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700',
  }
  return map[tipo] ?? 'bg-gray-50'
}

function getBadgeVariant(tipo: TipoTurno): 'primary' | 'warning' | 'default' | 'success' {
  const map: Record<TipoTurno, 'primary' | 'warning' | 'default' | 'success'> = {
    plantao: 'primary',
    sobreaviso: 'warning',
    extra: 'default',
    ferias: 'success',
    folga: 'default',
  }
  return map[tipo] ?? 'default'
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  data: string
  horaInicio: string
  horaFim: string
  tipo: TipoTurno
  local: string
  observacao: string
  alarmeAtivo: boolean
}

interface ConfigFormData {
  tipo: TipoEscala
  horaInicio: string
  horaFim: string
  inicioCiclo: string
  local: string
  alarmeAtivo: boolean
}

// ─── API Functions ─────────────────────────────────────────────────────────────

async function fetchEscalas(ano: number, mes: number): Promise<EscalaEntry[]> {
  const headers = await getHeaders()
  const res = await fetch(`/api/escala?ano=${ano}&mes=${mes}`, { headers })
  if (!res.ok) throw new Error('Erro ao buscar escalas')
  const data = await res.json()
  return data.escalas
}

async function fetchConfig(): Promise<EscalaConfig | null> {
  const headers = await getHeaders()
  const res = await fetch('/api/escala/config', { headers })
  if (!res.ok) throw new Error('Erro ao buscar configuração')
  const data = await res.json()
  return data.config
}

async function fetchProximos(): Promise<EscalaEntry[]> {
  const headers = await getHeaders()
  const res = await fetch('/api/escala/proximos', { headers })
  if (!res.ok) throw new Error('Erro ao buscar próximas escalas')
  const data = await res.json()
  return data.escalas
}

async function createEscala(form: FormData): Promise<EscalaEntry> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' })
  const res = await fetch('/api/escala', {
    method: 'POST',
    headers,
    body: JSON.stringify(form),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao criar escala')
  }
  const data = await res.json()
  return data.escala
}

async function updateEscala(id: string, form: Partial<FormData>): Promise<EscalaEntry> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' })
  const res = await fetch(`/api/escala/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(form),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao atualizar escala')
  }
  const data = await res.json()
  return data.escala
}

async function deleteEscala(id: string): Promise<void> {
  const headers = await getHeaders()
  const res = await fetch(`/api/escala/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error('Erro ao deletar escala')
}

async function saveConfig(form: ConfigFormData): Promise<EscalaConfig> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' })
  const res = await fetch('/api/escala/config', {
    method: 'POST',
    headers,
    body: JSON.stringify(form),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao salvar configuração')
  }
  const data = await res.json()
  return data.config
}

async function deleteAllData(): Promise<void> {
  const headers = await getHeaders()
  const res = await fetch('/api/escala/config/delete', { method: 'DELETE', headers })
  if (!res.ok) throw new Error('Erro ao remover dados')
}

/** Aplica o padrão da escala ao mês — cria plantões em lote (idempotente) */
async function aplicarPadrao(payload: {
  dias: number[]
  ano: number
  mes: number
  horaInicio: string
  horaFim: string
  local?: string
  alarmeAtivo?: boolean
}): Promise<{ created: number; skipped: number }> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' })
  const res = await fetch('/api/escala/aplicar-padrao', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao aplicar padrão da escala')
  }
  return res.json()
}

async function aplicarCiclo(payload: {
  dataInicio: string
  tipo: TipoEscala
  horaInicio: string
  horaFim: string
  local?: string
  alarmeAtivo?: boolean
}): Promise<{ created: number; total: number; skipped: number }> {
  const headers = await getHeaders({ 'Content-Type': 'application/json' })
  const res = await fetch('/api/escala/aplicar-ciclo', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao aplicar ciclo até dezembro')
  }
  return res.json()
}

// ─── LocalPickerField — tab + grid picker (replaces dropdown) ────────────────

type LocalTab = 'bpm' | 'especial' | 'upp' | 'cpp'

function LocalPickerField({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<LocalTab>('bpm')
  const [search, setSearch] = useState('')

  const selected = value === NONE_LOCAL ? '' : value

  const filteredBPM = search
    ? LOCAIS_BPM.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : LOCAIS_BPM

  const filteredEsp = search
    ? LOCAIS_ESPECIAL.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : LOCAIS_ESPECIAL

  const filteredUPP = search
    ? LOCAIS_UPP.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : LOCAIS_UPP

  const filteredCPP = search
    ? LOCAIS_CPP.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : LOCAIS_CPP

  const pick = (v: string) => {
    onValueChange(v)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm transition-all duration-200',
          'bg-white dark:bg-[#1E1E1E]',
          open
            ? 'border-blue-500 ring-2 ring-blue-500/20 rounded-b-none border-b-transparent'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400',
          selected ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
        )}
      >
        <span className="truncate">{selected || 'Selecionar unidade...'}</span>
        <ChevronDown size={15} className={cn('shrink-0 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {/* Panel */}
      {open && (
        <div className={cn(
          'border border-t-0 border-blue-500 rounded-b-xl bg-white dark:bg-[#1E1E1E]',
          'shadow-lg overflow-hidden'
        )}>
          {/* Search */}
          <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-gray-700/60">
            <input
              autoFocus
              type="text"
              placeholder="Buscar unidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Tabs — only when not searching */}
          {!search && (
            <div className="flex border-b border-gray-100 dark:border-gray-700/60">
              {([['bpm', '🏢 Batalhões'], ['especial', '⭐ Especial'], ['upp', '🛡 UPPs'], ['cpp', '🚓 CPP']] as [LocalTab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold transition-all duration-150',
                    tab === t
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 -mb-px bg-blue-50/50 dark:bg-blue-900/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[220px] p-2">
            {search ? (
              // Search results — flat list across all groups
              <div className="space-y-0.5">
                {[...filteredBPM, ...filteredEsp, ...filteredUPP, ...filteredCPP].length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4">Nenhuma unidade encontrada</p>
                ) : (
                  [...filteredBPM, ...filteredEsp, ...filteredUPP, ...filteredCPP].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => pick(l)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors duration-100',
                        selected === l
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      {l}
                      {selected === l && <Check size={12} className="inline ml-2 text-blue-500" />}
                    </button>
                  ))
                )}
              </div>
            ) : tab === 'bpm' ? (
              // BPMs — list with number + location (full v1 names)
              <div className="space-y-0.5">
                {filteredBPM.map((l) => {
                  // Format: "Nº BPM - Location"
                  const match = l.match(/^(\d+)º BPM\s*-\s*(.+)$/)
                  const num = match?.[1] ?? l
                  const loc = match?.[2] ?? ''
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => pick(l)}
                      title={l}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors duration-100',
                        selected === l
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[11px] font-bold shrink-0',
                        selected === l
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      )}>
                        {num}º
                      </span>
                      <span className="truncate">{loc}</span>
                      {selected === l && <Check size={12} className="ml-auto text-blue-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ) : tab === 'especial' ? (
              // Especial — pill grid
              <div className="flex flex-wrap gap-1.5">
                {filteredEsp.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => pick(l)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-100 border',
                      selected === l
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            ) : tab === 'upp' ? (
              // UPPs — compact list
              <div className="space-y-0.5">
                {filteredUPP.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => pick(l)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors duration-100',
                      selected === l
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {l}
                    {selected === l && <Check size={12} className="inline ml-2 text-green-500" />}
                  </button>
                ))}
              </div>
            ) : (
              // CPP — single option
              <div className="space-y-0.5">
                {filteredCPP.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => pick(l)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors duration-100',
                      selected === l
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {l}
                    {selected === l && <Check size={12} className="inline ml-2 text-amber-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear / confirm footer */}
          {selected && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30">
              <span className="text-xs text-gray-500 truncate">Selecionado: <strong className="text-gray-700 dark:text-gray-300">{selected}</strong></span>
              <button
                type="button"
                onClick={() => pick(NONE_LOCAL)}
                className="text-xs text-red-500 hover:text-red-600 font-medium ml-2 shrink-0"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DateField — clickable anywhere to open native picker ────────────────────

function DateField({
  label,
  value,
  onChange,
  helper,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  helper?: string
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => {
    try {
      inputRef.current?.showPicker()
    } catch {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <button
          type="button"
          onClick={openPicker}
          className="self-start text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {label}
          {required && <span className="ml-1 text-error" aria-hidden>*</span>}
        </button>
      )}
      <div
        onClick={openPicker}
        className={cn(
          'flex w-full items-center rounded-lg border bg-white px-3.5 py-2.5 cursor-pointer',
          'border-gray-300 dark:border-gray-600 dark:bg-[#1E1E1E]',
          'focus-within:ring-2 focus-within:ring-offset-0 focus-within:ring-accent-blue focus-within:border-accent-blue',
          'transition-all duration-200'
        )}
      >
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="flex-1 text-sm text-gray-900 dark:text-gray-100 bg-transparent border-0 outline-none cursor-pointer"
        />
      </div>
      {helper && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountdownWidget({ proxima }: { proxima: EscalaEntry | undefined }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!proxima) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400 dark:text-gray-500">
        <CalendarDays size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Nenhum plantão agendado</p>
      </div>
    )
  }

  const progresso = calcularProgresso(proxima.data, proxima.horaInicio, proxima.horaFim)
  const meta = TIPO_TURNO_META[proxima.tipo as TipoTurno]

  let countdownText = ''
  if (progresso.status === 'futuro') {
    const [ano, mes, dia] = proxima.data.split('-').map(Number)
    const [h, m] = proxima.horaInicio.split(':').map(Number)
    const shiftStart = new Date(ano, mes - 1, dia, h, m)
    const diffMs = shiftStart.getTime() - now.getTime()
    const diffH = Math.floor(diffMs / (1000 * 60 * 60))
    const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffH > 48) {
      countdownText = `em ${Math.ceil(diffH / 24)} dias`
    } else if (diffH > 0) {
      countdownText = `${diffH}h ${diffM}m`
    } else {
      countdownText = `${diffM}m`
    }
  } else if (progresso.status === 'em_progresso') {
    countdownText = `${progresso.pct}% concluído`
  } else {
    countdownText = 'Concluído'
  }

  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference - (progresso.pct / 100) * circumference
  const ringColor =
    progresso.status === 'em_progresso'
      ? '#3b82f6'
      : progresso.status === 'concluido'
      ? '#22c55e'
      : '#e5e7eb'

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-800" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={ringColor} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={strokeDash}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl">{meta?.emoji ?? '🚔'}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
          {progresso.status === 'em_progresso' ? 'Em andamento' : 'Próximo plantão'}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
          {countdownText}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{formatarData(proxima.data)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {proxima.horaInicio} – {proxima.horaFim}
          {proxima.local && ` · ${proxima.local}`}
        </p>
      </div>
    </div>
  )
}

function StatCards({
  config,
  proxima,
  escalas,
  escalasProximas,
}: {
  config: EscalaConfig | null
  proxima: EscalaEntry | undefined
  escalas: EscalaEntry[]
  escalasProximas: EscalaEntry[]
}) {
  const proximo = diasAteProximo(escalasProximas)
  const horas = horasNoMes(escalas)
  const plantoes = escalas.filter((e) => e.tipo === 'plantao').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Escala Ativa</p>
            {config ? (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{config.tipo}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.horaInicio} – {config.horaFim}</p>
              </>
            ) : (
              <p className="text-base text-gray-400 dark:text-gray-500 mt-1">Não configurada</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Próx. Plantão</p>
            {proxima ? (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">{proximo.texto}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatarData(proxima.data)}</p>
              </>
            ) : (
              <p className="text-base text-gray-400 dark:text-gray-500 mt-1">Nenhum agendado</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Este Mês</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plantoes} {plantoes === 1 ? 'plantão' : 'plantões'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{horas}h trabalhadas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <BarChart3 size={20} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Modal: Add/Edit Shift ────────────────────────────────────────────────────

function ShiftModal({
  open,
  onClose,
  initialData,
  editId,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initialData?: Partial<FormData>
  editId?: string
  onSaved: (escala?: EscalaEntry) => void | Promise<void>
}) {
  const today = todaySP()
  const [form, setForm] = useState<FormData>({
    data: initialData?.data ?? today,
    horaInicio: initialData?.horaInicio ?? '07:00',
    horaFim: initialData?.horaFim ?? '19:00',
    tipo: initialData?.tipo ?? 'plantao',
    local: initialData?.local ?? '',
    observacao: initialData?.observacao ?? '',
    alarmeAtivo: initialData?.alarmeAtivo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        data: initialData?.data ?? today,
        horaInicio: initialData?.horaInicio ?? '07:00',
        horaFim: initialData?.horaFim ?? '19:00',
        tipo: initialData?.tipo ?? 'plantao',
        local: initialData?.local ?? '',
        observacao: initialData?.observacao ?? '',
        alarmeAtivo: initialData?.alarmeAtivo ?? true,
      })
      setError('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let saved: EscalaEntry
      if (editId) {
        saved = await updateEscala(editId, form)
      } else {
        saved = await createEscala(form)
      }
      // Atualização otimista: passar a escala salva ao parent para inserir/atualizar imediatamente
      await onSaved(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editId ? 'Editar Turno' : 'Adicionar Turno'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Data + Tipo — stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <FL>Data *</FL>
              <DateField
                label=""
                value={form.data}
                onChange={(v) => setForm((f) => ({ ...f, data: v }))}
                required
              />
            </div>
            <Select
              label="Tipo de serviço *"
              labelClassName={FL_CLASS}
              options={TIPO_TURNO_OPTIONS}
              value={form.tipo}
              onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoTurno }))}
              required
            />
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Hora início *"
              labelClassName={FL_CLASS}
              options={HORA_OPTIONS}
              value={form.horaInicio}
              onValueChange={(v) => setForm((f) => ({ ...f, horaInicio: v }))}
              required
            />
            <Select
              label="Hora fim *"
              labelClassName={FL_CLASS}
              options={HORA_OPTIONS}
              value={form.horaFim}
              onValueChange={(v) => setForm((f) => ({ ...f, horaFim: v }))}
              required
            />
          </div>

          {/* Local */}
          <div className="flex flex-col gap-1">
            <FL>Local de Serviço</FL>
            <LocalPickerField
              value={form.local || NONE_LOCAL}
              onValueChange={(v) => setForm((f) => ({ ...f, local: v === NONE_LOCAL ? '' : v }))}
            />
          </div>

          {/* Observação */}
          <div className="flex flex-col gap-1">
            <FL>Observação <span className="normal-case font-normal">({form.observacao.length}/200)</span></FL>
            <textarea
              value={form.observacao}
              onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value.slice(0, 200) }))}
              rows={2}
              placeholder="Observações opcionais..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-all duration-200 resize-none"
            />
          </div>

          {/* Alarme — igual ao v1 */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={form.alarmeAtivo}
                onClick={() => setForm((f) => ({ ...f, alarmeAtivo: !f.alarmeAtivo }))}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
                  form.alarmeAtivo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span className={cn(
                  'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                  form.alarmeAtivo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                )} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Bell size={13} className={form.alarmeAtivo ? 'text-blue-500' : 'text-gray-400'} />
                  Notificação 12h antes do serviço
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  A notificação será enviada via email e push
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={saving} loadingText="Salvando...">
              {editId ? 'Salvar Alterações' : 'Adicionar Turno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Field label — small, uppercase, like v1's .p-label ─────────────────────

const FL_CLASS = 'text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none'

function FL({ children }: { children: React.ReactNode }) {
  return (
    <p className={FL_CLASS}>
      {children}
    </p>
  )
}

// ─── Modal: Configure Schedule ─────────────────────────────────────────────────

function ConfigModal({
  open,
  onClose,
  currentConfig,
  currentAno,
  currentMes,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  currentConfig: EscalaConfig | null
  currentAno: number
  currentMes: number
  onSaved: () => void
}) {
  const [form, setForm] = useState<ConfigFormData>({
    tipo: currentConfig?.tipo ?? '24x72',
    horaInicio: currentConfig?.horaInicio ?? '07:00',
    horaFim: currentConfig?.horaFim ?? '07:00',
    inicioCiclo: currentConfig?.inicioCiclo ?? todaySP(),
    local: currentConfig?.local ?? '',
    alarmeAtivo: currentConfig?.alarmeAtivo ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [applyingCycle, setApplyingCycle] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const previewDays = React.useMemo(() => {
    if (!form.inicioCiclo) return []
    try {
      const [a, m, d] = form.inicioCiclo.split('-').map(Number)
      return calcularDias(form.tipo as TipoEscala, new Date(a, m - 1, d), currentAno, currentMes)
    } catch { return [] }
  }, [form.tipo, form.inicioCiclo, currentAno, currentMes])

  // Auto-fill horaFim whenever tipo or horaInicio changes
  useEffect(() => {
    setForm((f) => ({ ...f, horaFim: calcHoraFim(f.tipo, f.horaInicio) }))
  }, [form.tipo, form.horaInicio])

  useEffect(() => {
    if (open) {
      const tipo = currentConfig?.tipo ?? '24x72'
      const horaInicio = currentConfig?.horaInicio ?? '07:00'
      setForm({
        tipo,
        horaInicio,
        horaFim: currentConfig?.horaFim ?? calcHoraFim(tipo, horaInicio),
        inicioCiclo: currentConfig?.inicioCiclo ?? todaySP(),
        local: currentConfig?.local ?? '',
        alarmeAtivo: currentConfig?.alarmeAtivo ?? true,
      })
      setError('')
      setConfirmDelete(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.local || form.local === NONE_LOCAL) {
      setError('Selecione o local do serviço')
      return
    }
    if (previewDays.length === 0) {
      setError('Nenhum dia de plantão calculado. Verifique a data de início do ciclo.')
      return
    }
    setSaving(true)
    setError('')
    try {
      // 1) Salva a configuração
      await saveConfig(form)
      // 2) Aplica o padrão ao mês visualizado — cria plantões em lote (idempotente)
      await aplicarPadrao({
        dias: previewDays,
        ano: currentAno,
        mes: currentMes,
        horaInicio: form.horaInicio,
        horaFim: form.horaFim,
        local: form.local,
        alarmeAtivo: form.alarmeAtivo,
      })
      // 3) Recarrega tudo
      await (onSaved as () => Promise<void>)()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyCycle = async () => {
    if (!form.local || form.local === NONE_LOCAL) {
      setError('Selecione o local do serviço')
      return
    }
    setApplyingCycle(true)
    setError('')
    try {
      await saveConfig(form)
      await aplicarCiclo({
        dataInicio: form.inicioCiclo,
        tipo: form.tipo as TipoEscala,
        horaInicio: form.horaInicio,
        horaFim: form.horaFim,
        local: form.local,
        alarmeAtivo: form.alarmeAtivo,
      })
      await (onSaved as () => Promise<void>)()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar ciclo')
    } finally {
      setApplyingCycle(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deleteAllData()
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao remover dados')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Configurar Escala</DialogTitle>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Escolha o padrão e a data de início — os dias do mês serão calculados automaticamente.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Padrão + Início do Ciclo — 2 cols on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tipo de Escala *"
              labelClassName={FL_CLASS}
              options={TIPO_ESCALA_OPTIONS}
              value={form.tipo}
              onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoEscala }))}
              required
            />
            <div className="flex flex-col gap-1">
              <FL>Início do ciclo *</FL>
              <DateField
                label=""
                value={form.inicioCiclo}
                onChange={(v) => setForm((f) => ({ ...f, inicioCiclo: v }))}
                required
              />
            </div>
          </div>

          {/* Hora início + Hora fim — 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Hora início *"
              labelClassName={FL_CLASS}
              options={HORA_OPTIONS}
              value={form.horaInicio}
              onValueChange={(v) => setForm((f) => ({ ...f, horaInicio: v, horaFim: calcHoraFim(f.tipo, v) }))}
              required
            />
            <div className="flex flex-col gap-1">
              <FL>Hora fim <span className="normal-case font-normal">(automático)</span></FL>
              <div className="flex items-center h-[42px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3.5">
                <span className="text-sm text-gray-600 dark:text-gray-400">{form.horaFim}</span>
              </div>
            </div>
          </div>

          {/* Local do Serviço — obrigatório */}
          <div className="flex flex-col gap-1">
            <FL>Local do Serviço *</FL>
            <LocalPickerField
              value={form.local || NONE_LOCAL}
              onValueChange={(v) => setForm((f) => ({ ...f, local: v === NONE_LOCAL ? '' : v }))}
            />
          </div>

          {/* Alarme — igual ao v1 */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={form.alarmeAtivo}
                onClick={() => setForm((f) => ({ ...f, alarmeAtivo: !f.alarmeAtivo }))}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
                  form.alarmeAtivo ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span className={cn(
                  'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                  form.alarmeAtivo ? 'translate-x-[18px]' : 'translate-x-[3px]'
                )} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <Bell size={13} className={form.alarmeAtivo ? 'text-blue-500' : 'text-gray-400'} />
                  Notificação 12h antes do serviço
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  A notificação será enviada via email e push
                </p>
              </div>
            </label>
          </div>

          {/* Preview de dias calculados */}
          {previewDays.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">
                📋 Dias calculados — {formatarMesAno(currentAno, currentMes)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previewDays.map((dia) => (
                  <span key={dia} className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold bg-blue-500 text-white">
                    {dia}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {previewDays.length} dia{previewDays.length !== 1 ? 's' : ''} de plantão neste mês
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-1">
            {currentConfig && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                isLoading={deleting}
                loadingText="Removendo..."
                className="sm:mr-auto"
              >
                {confirmDelete ? 'Confirmar exclusão?' : 'Remover todos os dados'}
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            </DialogClose>
            <Button
              type="button"
              variant="secondary"
              onClick={handleApplyCycle}
              isLoading={applyingCycle}
              loadingText="Aplicando até dez..."
            >
              📅 Até Dezembro
            </Button>
            <Button type="submit" isLoading={saving} loadingText={`Aplicando ${previewDays.length} dia${previewDays.length !== 1 ? 's' : ''}...`}>
              ✅ Aplicar ao mês
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({
  ano,
  mes,
  escalas,
  today,
  onDayClick,
}: {
  ano: number
  mes: number
  escalas: EscalaEntry[]
  today: string
  onDayClick: (dateStr: string) => void
}) {
  const daysInMonth = new Date(ano, mes, 0).getDate()
  const firstDayOfWeek = new Date(ano, mes - 1, 1).getDay()

  const escalasByDay = React.useMemo(() => {
    const map: Record<number, EscalaEntry[]> = {}
    for (const e of escalas) {
      const dia = parseInt(e.data.split('-')[2])
      if (!map[dia]) map[dia] = []
      map[dia].push(e)
    }
    return map
  }, [escalas])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Weekday header — v1 style: blue tint background */}
      <div className="grid grid-cols-7 bg-blue-50/60 dark:bg-blue-900/10 border-b border-gray-200 dark:border-gray-700">
        {DIAS_SEMANA_HEADER.map((d) => (
          <div key={d} className="text-center py-2.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid — v1 style: bordered cells, no gap */}
      <div className="grid grid-cols-7">
        {cells.map((dia, idx) => {
          if (dia === null) {
            return <div key={`empty-${idx}`} className="bg-gray-50 dark:bg-gray-900/40 min-h-[60px] sm:min-h-[68px] border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0" />
          }

          const dateStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
          const isToday = dateStr === today
          const dayEscalas = escalasByDay[dia] ?? []
          const firstEscala = dayEscalas[0]
          const hasShift = dayEscalas.length > 0
          const isPlantaoOrExtra = firstEscala && (firstEscala.tipo === 'plantao' || firstEscala.tipo === 'extra')
          const isOtherType = firstEscala && !isPlantaoOrExtra

          // Cell background — v1 style
          let cellBg = 'bg-white dark:bg-[#1E1E1E] hover:bg-blue-50/60 dark:hover:bg-blue-900/15'
          let textColor = 'text-gray-700 dark:text-gray-300'
          let borderColor = 'border-gray-200 dark:border-gray-700'

          if (isToday) {
            cellBg = 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
            textColor = 'text-white'
            borderColor = 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-700/50 z-10 relative'
          } else if (isPlantaoOrExtra) {
            cellBg = 'bg-blue-100/60 dark:bg-blue-900/25 hover:bg-blue-100 dark:hover:bg-blue-900/40'
            textColor = 'text-blue-700 dark:text-blue-300'
            borderColor = 'border-blue-300 dark:border-blue-700'
          } else if (isOtherType) {
            cellBg = 'bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100/80 dark:hover:bg-teal-900/30'
            textColor = 'text-teal-700 dark:text-teal-400'
            borderColor = 'border-teal-300 dark:border-teal-700'
          }

          return (
            <button
              key={dia}
              onClick={() => onDayClick(dateStr)}
              aria-label={`${dia} de ${mes}`}
              className={cn(
                'relative min-h-[60px] sm:min-h-[68px] border-r border-b flex flex-col items-center justify-center gap-1 px-1 py-1.5 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                cellBg,
                borderColor,
                'last:border-r-0'
              )}
            >
              <span className={cn('text-sm font-semibold leading-none', textColor, isToday && 'font-extrabold')}>
                {dia}
              </span>

              {/* Progress bar — v1 style */}
              {hasShift && firstEscala && (() => {
                const progresso = calcularProgresso(firstEscala.data, firstEscala.horaInicio, firstEscala.horaFim)
                // v1 colors:
                //  futuro -> amarelo (#FBBF24) full width
                //  em_progresso -> laranja (#F59E0B) at pct%
                //  concluido -> verde (#10B981) full width
                const barColor =
                  progresso.status === 'futuro'
                    ? 'bg-yellow-400'
                    : progresso.status === 'em_progresso'
                    ? 'bg-orange-500'
                    : 'bg-emerald-500'
                const barWidth = progresso.status === 'futuro' ? 100 : progresso.status === 'concluido' ? 100 : progresso.pct
                return (
                  <div className="w-full h-3 rounded-sm bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                    <div
                      className={cn('absolute inset-y-0 left-0 rounded-sm transition-all', barColor)}
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className={cn(
                      'absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none',
                      isToday ? 'text-white drop-shadow' : 'text-gray-700 dark:text-gray-200'
                    )}>
                      {progresso.pct}%
                    </span>
                  </div>
                )
              })()}

              {dayEscalas.length > 1 && (
                <span className={cn('text-[9px] font-medium leading-none', isToday ? 'text-white/80' : 'text-gray-400 dark:text-gray-500')}>
                  +{dayEscalas.length - 1}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Shift List Item ───────────────────────────────────────────────────────────

function ShiftListItem({
  escala,
  onEdit,
  onDelete,
}: {
  escala: EscalaEntry
  onEdit: (e: EscalaEntry) => void
  onDelete: (id: string) => void
}) {
  const meta = TIPO_TURNO_META[escala.tipo as TipoTurno]
  const progresso = calcularProgresso(escala.data, escala.horaInicio, escala.horaFim)

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${getShiftBgLight(
        escala.tipo as TipoTurno
      )}`}
    >
      {/* Emoji badge */}
      <div className="w-10 h-10 rounded-lg bg-white/60 dark:bg-gray-800/60 flex items-center justify-center shrink-0 text-lg">
        {meta?.emoji ?? '🚔'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatarData(escala.data)}
          </p>
          <Badge variant={getBadgeVariant(escala.tipo as TipoTurno)} size="sm">
            {meta?.label ?? escala.tipo}
          </Badge>
          {progresso.status === 'em_progresso' && (
            <Badge variant="primary" size="sm">Em andamento</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Clock size={11} />
            {escala.horaInicio} – {escala.horaFim}
          </p>
          {escala.local && (
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MapPin size={11} />
              {escala.local}
            </p>
          )}
          {escala.alarmeAtivo ? (
            <Bell size={11} className="text-blue-400" />
          ) : (
            <BellOff size={11} className="text-gray-300 dark:text-gray-600" />
          )}
        </div>
        {escala.observacao && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{escala.observacao}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(escala)}
          aria-label="Editar turno"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-150"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(escala.id)}
          aria-label="Excluir turno"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all duration-150"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EscalaPage() {
  const today = todaySP()
  const [currentDate] = useState(() => {
    const [y, m] = today.split('-').map(Number)
    return { ano: y, mes: m }
  })
  const [viewAno, setViewAno] = useState(currentDate.ano)
  const [viewMes, setViewMes] = useState(currentDate.mes)

  const [escalas, setEscalas] = useState<EscalaEntry[]>([])
  const [escalasProximas, setEscalasProximas] = useState<EscalaEntry[]>([])
  const [config, setConfig] = useState<EscalaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<EscalaEntry | null>(null)
  const [prefillDate, setPrefillDate] = useState<string>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      // Use allSettled so a failure in one (e.g. proximos) doesn't block the others
      const [escResult, cfgResult, proxResult] = await Promise.allSettled([
        fetchEscalas(viewAno, viewMes),
        fetchConfig(),
        fetchProximos(),
      ])

      if (escResult.status === 'fulfilled') setEscalas(escResult.value)
      else setLoadError(escResult.reason?.message ?? 'Erro ao buscar escalas')

      if (cfgResult.status === 'fulfilled') setConfig(cfgResult.value)

      if (proxResult.status === 'fulfilled') setEscalasProximas(proxResult.value)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [viewAno, viewMes])

  useEffect(() => {
    loadData()
  }, [loadData])

  const prevMonth = () => {
    if (viewMes === 1) { setViewMes(12); setViewAno((y) => y - 1) }
    else setViewMes((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMes === 12) { setViewMes(1); setViewAno((y) => y + 1) }
    else setViewMes((m) => m + 1)
  }

  const handleDayClick = (dateStr: string) => {
    setPrefillDate(dateStr)
    setEditShift(null)
    setShiftModalOpen(true)
  }

  const handleEditShift = (escala: EscalaEntry) => {
    setEditShift(escala)
    setPrefillDate('')
    setShiftModalOpen(true)
  }

  const handleDeleteShift = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este turno?')) return
    setDeletingId(id)
    try {
      await deleteEscala(id)
      // Otimista: remove imediatamente do estado
      setEscalas((prev) => prev.filter((e) => e.id !== id))
      setEscalasProximas((prev) => prev.filter((e) => e.id !== id))
      // Sincroniza em segundo plano
      loadData()
    } catch {
      // Em caso de erro, recarrega para sincronizar
      loadData()
    } finally {
      setDeletingId(null)
    }
  }

  // Atualiza estado otimisticamente quando ShiftModal salva uma escala
  const handleShiftSaved = useCallback(async (saved?: EscalaEntry) => {
    if (saved) {
      // Pertence ao mês visualizado?
      const [savedAno, savedMes] = saved.data.split('-').map(Number)
      const isCurrentMonth = savedAno === viewAno && savedMes === viewMes

      setEscalas((prev) => {
        const filtered = prev.filter((e) => e.id !== saved.id) // remove se já existia (edit)
        if (isCurrentMonth) {
          return [...filtered, saved].sort((a, b) => a.data.localeCompare(b.data))
        }
        return filtered
      })

      setEscalasProximas((prev) => {
        const filtered = prev.filter((e) => e.id !== saved.id)
        return [...filtered, saved]
          .sort((a, b) => a.data.localeCompare(b.data))
          .slice(0, 10)
      })
    }
    // Sincroniza com backend em segundo plano
    loadData()
  }, [viewAno, viewMes, loadData])

  const proximaEscala = React.useMemo(() => {
    const r = diasAteProximo(escalasProximas)
    return r.proxima
  }, [escalasProximas])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Escala de Trabalho
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Clique em um dia no calendário para marcar ou editar um turno
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Settings size={14} />}
          onClick={() => setConfigModalOpen(true)}
        >
          Configurar Escala
        </Button>
      </div>

      {/* Stat Cards */}
      <StatCards
        config={config}
        proxima={proximaEscala}
        escalas={escalas}
        escalasProximas={escalasProximas}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar — v1 fintech style: dark gradient header */}
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800">
            <h3 className="text-base font-extrabold text-white tracking-tight capitalize">
              {formatarMesAno(viewAno, viewMes)}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="w-9 h-9 rounded-xl grid place-items-center text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => { setViewAno(currentDate.ano); setViewMes(currentDate.mes) }}
                className="px-3 h-9 rounded-xl text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Hoje
              </button>
              <button
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="w-9 h-9 rounded-xl grid place-items-center text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <AlertTriangle size={32} className="text-red-400" />
                <p className="text-sm text-gray-500">{loadError}</p>
                <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <CalendarGrid
                  ano={viewAno}
                  mes={viewMes}
                  escalas={escalas}
                  today={today}
                  onDayClick={handleDayClick}
                />

                {/* Legenda compacta — embaixo do calendário */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" /> Futuro
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> Em andamento
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Concluído
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tipo</span>
                    {Object.entries(TIPO_TURNO_META).map(([tipo, meta]) => (
                      <span key={tipo} className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                        <span className={`w-2.5 h-2.5 rounded-sm ${getShiftBg(tipo as TipoTurno)}`} />
                        {meta.emoji} {meta.label}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              Próximo Turno
            </p>
            <CountdownWidget proxima={proximaEscala} />
          </Card>
        </div>
      </div>

      {/* Shift List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Turnos de {formatarMesAno(viewAno, viewMes)}</CardTitle>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {escalas.length} registro{escalas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : escalas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400 dark:text-gray-500">
              <CalendarDays size={40} className="opacity-40" />
              <p className="text-sm">Nenhum turno registrado neste mês</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Clique em um dia no calendário para adicionar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {escalas.map((e) => (
                <div
                  key={e.id}
                  className={`transition-opacity duration-300 ${deletingId === e.id ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <ShiftListItem
                    escala={e}
                    onEdit={handleEditShift}
                    onDelete={handleDeleteShift}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <ShiftModal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        initialData={
          editShift
            ? {
                data: editShift.data,
                horaInicio: editShift.horaInicio,
                horaFim: editShift.horaFim,
                tipo: editShift.tipo as TipoTurno,
                local: editShift.local ?? '',
                observacao: editShift.observacao ?? '',
                alarmeAtivo: editShift.alarmeAtivo,
              }
            : prefillDate
            ? {
                data: prefillDate,
                horaInicio: config?.horaInicio ?? '07:00',
                horaFim: config?.horaFim ?? '19:00',
                local: config?.local ?? '',
                alarmeAtivo: config?.alarmeAtivo ?? true,
              }
            : undefined
        }
        editId={editShift?.id}
        onSaved={handleShiftSaved}
      />

      {/* Config Modal */}
      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        currentConfig={config}
        currentAno={viewAno}
        currentMes={viewMes}
        onSaved={loadData}
      />
    </div>
  )
}
