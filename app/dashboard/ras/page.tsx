'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  fmtBRL,
  getRasPrice,
  RAS_LOCALS_BPM,
  RAS_LOCALS_SPECIAL,
  RAS_LOCALS_UPP,
  RAS_STATUS_LABELS,
  RAS_STATUS_COLORS,
  RAS_GRADUACAO_LABELS,
  RAS_TIPO_LABELS,
  RAS_VAGA_LABELS,
  RAS_DURACAO_TYPES,
  RAS_MAX_MONTHLY_HOURS,
  RAS_WARNING_THRESHOLD,
} from '@/types/ras'
import type {
  RasAgenda,
  GraduacaoRas,
  DuracaoRas,
  TipoRas,
  TipoVagaRas,
  StatusRas,
  RasMonthStats,
} from '@/types/ras'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowBR(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
}

function fmtCompetencia(yyyy_mm: string): string {
  const [y, m] = yyyy_mm.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m, 10) - 1]} ${y}`
}

function addMonths(yyyy_mm: string, n: number): string {
  const [y, m] = yyyy_mm.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dateToBR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirado'
  const h = Math.floor(diff / 3600000)
  const min = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${min}min`
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchRas(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`/api/ras?${qs}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data as { rasAgendas: RasAgenda[]; total: number; totalPages: number }
}

async function fetchStats(mes: string) {
  const res = await fetch(`/api/ras/stats?mes=${mes}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data as RasMonthStats
}

async function createRas(body: object) {
  const res = await fetch('/api/ras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data as RasAgenda
}

async function updateRas(id: string, body: object) {
  const res = await fetch(`/api/ras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data as RasAgenda
}

async function deleteRas(id: string) {
  const res = await fetch(`/api/ras/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data as RasAgenda
}

async function registrarPagamento(rasId: string, body: object) {
  const res = await fetch(`/api/ras/${rasId}/pagamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}

// ─── Modal Agendar/Editar ─────────────────────────────────────────────────────

interface ModalFormProps {
  initial?: RasAgenda | null
  competencia: string
  prefillDate?: string
  onClose: () => void
  onSaved: () => void
}

function ModalForm({ initial, competencia, prefillDate, onClose, onSaved }: ModalFormProps) {
  const qc = useQueryClient()

  const savedGrad =
    typeof window !== 'undefined'
      ? (localStorage.getItem('ras_graduacao') as GraduacaoRas | null)
      : null

  const [data, setData] = useState(initial ? initial.data.slice(0, 10) : (prefillDate ?? ''))
  const [horaInicio, setHoraInicio] = useState(initial?.horaInicio ?? '07:00')
  const [duracao, setDuracao] = useState<DuracaoRas>((initial?.duracao as DuracaoRas) ?? 12)
  const [graduacao, setGraduacao] = useState<GraduacaoRas>(
    (initial?.graduacao as GraduacaoRas) ?? savedGrad ?? 'SD/CB'
  )
  const [tipo, setTipo] = useState<TipoRas>((initial?.tipo as TipoRas) ?? 'voluntario')
  const [tipoVaga, setTipoVaga] = useState<TipoVagaRas>((initial?.tipoVaga as TipoVagaRas) ?? 'titular')
  const [local, setLocal] = useState(initial?.local ?? '')
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '')
  const [error, setError] = useState('')

  const horaFim = (() => {
    const [h, m] = horaInicio.split(':').map(Number)
    const totalMin = h * 60 + m + duracao * 60
    const fh = Math.floor(totalMin / 60) % 24
    const fm = totalMin % 60
    return `${String(fh).padStart(2, '0')}:${String(fm).padStart(2, '0')}`
  })()

  const computedCompetencia = data.length === 10 ? data.slice(0, 7) : competencia
  const precoPreview = fmtBRL(getRasPrice(graduacao, duracao))

  const mutation = useMutation({
    mutationFn: (body: object) =>
      initial ? updateRas(initial.id, body) : createRas(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ras'] })
      qc.invalidateQueries({ queryKey: ['ras-stats'] })
      localStorage.setItem('ras_graduacao', graduacao)
      onSaved()
    },
    onError: (e: Error) => setError(e.message),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!data || !local) {
      setError('Preencha data e local')
      return
    }
    mutation.mutate({
      data,
      horaInicio,
      horaFim,
      duracao,
      local,
      graduacao,
      tipo,
      tipoVaga,
      competencia: computedCompetencia,
      observacoes: observacoes || undefined,
    })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const localGroups = [
    { label: 'BPM', options: RAS_LOCALS_BPM },
    { label: 'Especiais', options: RAS_LOCALS_SPECIAL },
    { label: 'UPP', options: RAS_LOCALS_UPP },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl p-6 overflow-y-auto"
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-5">
          {initial ? '✏️ Editar RAS' : '➕ Agendar RAS'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
              required
            />
          </div>

          {/* Hora Início */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hora de Início</label>
            <select
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hh = String(i).padStart(2, '0')
                return (
                  <option key={hh} value={`${hh}:00`}>
                    {hh}:00
                  </option>
                )
              })}
            </select>
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Duração</label>
            <div className="grid grid-cols-4 gap-2">
              {RAS_DURACAO_TYPES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuracao(d)}
                  className="rounded-lg py-2 text-sm font-semibold transition-all"
                  style={
                    duracao === d
                      ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff' }
                      : {
                          background: '#0f0f1a',
                          color: '#9ca3af',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }
                  }
                >
                  <div>{d}h</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>
                    {fmtBRL(getRasPrice(graduacao, d))}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Término: {horaFim}</p>
          </div>

          {/* Graduação */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Graduação</label>
            <div className="grid grid-cols-2 gap-2">
              {(['SD/CB', 'SGT/SUBTEN'] as GraduacaoRas[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGraduacao(g)}
                  className="rounded-lg py-2 text-sm font-medium"
                  style={
                    graduacao === g
                      ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff' }
                      : {
                          background: '#0f0f1a',
                          color: '#9ca3af',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }
                  }
                >
                  {RAS_GRADUACAO_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo + Vaga */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-1">
                {(['voluntario', 'compulsorio'] as TipoRas[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className="rounded-lg py-1.5 text-xs font-medium"
                    style={
                      tipo === t
                        ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff' }
                        : {
                            background: '#0f0f1a',
                            color: '#9ca3af',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }
                    }
                  >
                    {t === 'voluntario' ? '✅ Vol' : '⚡ Comp'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vaga</label>
              <div className="grid grid-cols-2 gap-1">
                {(['titular', 'reserva'] as TipoVagaRas[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTipoVaga(v)}
                    className="rounded-lg py-1.5 text-xs font-medium"
                    style={
                      tipoVaga === v
                        ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff' }
                        : {
                            background: '#0f0f1a',
                            color: '#9ca3af',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }
                    }
                  >
                    {v === 'titular' ? '★ Tit' : '🎭 Res'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Local</label>
            <select
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
              required
            >
              <option value="">Selecione o local...</option>
              {localGroups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-lg px-3 py-2 text-white resize-none text-sm"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>

          {/* Preço preview */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(37,99,235,0.3)',
            }}
          >
            <span className="text-sm text-gray-300">Valor do RAS</span>
            <span className="text-lg font-bold text-blue-400">{precoPreview}</span>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-gray-400 font-medium"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
            >
              {mutation.isPending ? 'Salvando...' : initial ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Confirmar ──────────────────────────────────────────────────────────

interface ModalConfirmarProps {
  ras: RasAgenda
  onClose: () => void
  onConfirmed: () => void
}

function ModalConfirmar({ ras, onClose, onConfirmed }: ModalConfirmarProps) {
  const qc = useQueryClient()
  const [obs, setObs] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      updateRas(ras.id, { status: 'confirmado', observacoes: obs || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ras'] })
      qc.invalidateQueries({ queryKey: ['ras-stats'] })
      onConfirmed()
    },
    onError: (e: Error) => setError(e.message),
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-2">🔒 Confirmar Pagamento</h2>
        <p className="text-gray-400 text-sm mb-4">
          {dateToBR(ras.data)} · {ras.horaInicio}–{ras.horaFim} · {ras.local}
        </p>
        <div
          className="rounded-xl p-3 mb-4 flex justify-between items-center"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
          }}
        >
          <span className="text-sm text-gray-300">Valor</span>
          <span className="text-lg font-bold text-emerald-400">
            {fmtBRL(ras.valorCentavos)}
          </span>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">
            Observações (opcional)
          </label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-lg px-3 py-2 text-white resize-none text-sm"
            style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
          />
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-gray-400"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
          >
            {mutation.isPending ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Registrar Pagamento ────────────────────────────────────────────────

interface ModalPagamentoProps {
  ras: RasAgenda
  onClose: () => void
  onSaved: () => void
}

function ModalPagamento({ ras, onClose, onSaved }: ModalPagamentoProps) {
  const qc = useQueryClient()
  const [valor, setValor] = useState(String(ras.valorCentavos / 100).replace('.', ','))
  const [dataPgto, setDataPgto] = useState(new Date().toISOString().slice(0, 10))
  const [comprovante, setComprovante] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const cents = Math.round(parseFloat(valor.replace(',', '.')) * 100)
      return registrarPagamento(ras.id, {
        valorCentavos: cents,
        dataPagamento: dataPgto,
        comprovante: comprovante || undefined,
        observacoes: obs || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ras'] })
      onSaved()
    },
    onError: (e: Error) => setError(e.message),
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl p-6"
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-2">💰 Registrar Pagamento</h2>
        <p className="text-gray-400 text-sm mb-4">
          {dateToBR(ras.data)} · {ras.local}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Valor Pago (R$)</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data do Pagamento</label>
            <input
              type="date"
              value={dataPgto}
              onChange={(e) => setDataPgto(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Comprovante (URL ou nº)</label>
            <input
              type="text"
              value={comprovante}
              onChange={(e) => setComprovante(e.target.value)}
              placeholder="Opcional"
              className="w-full rounded-lg px-3 py-2 text-white text-sm"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações</label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-lg px-3 py-2 text-white resize-none text-sm"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-gray-400"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
          >
            {mutation.isPending ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── RAS Item Card ────────────────────────────────────────────────────────────

interface RasCardProps {
  ras: RasAgenda
  tick: number
  onEdit: (r: RasAgenda) => void
  onConfirmar: (r: RasAgenda) => void
  onRealizar: (r: RasAgenda) => void
  onCancelar: (r: RasAgenda) => void
  onPagamento: (r: RasAgenda) => void
}

function RasCard({ ras, tick, onEdit, onConfirmar, onRealizar, onCancelar, onPagamento }: RasCardProps) {
  const sc = RAS_STATUS_COLORS[ras.status as StatusRas]
  const label = RAS_STATUS_LABELS[ras.status as StatusRas]
  const canConfirm = ras.status === 'realizado' || ras.status === 'pendente'
  const canRealizar = ras.status === 'agendado'
  const canEdit = ras.status === 'agendado'
  const canCancel = ras.status !== 'confirmado' && ras.status !== 'cancelado'
  const canPagamento = ras.status === 'confirmado' || ras.status === 'pendente'

  void tick

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#12122a', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ color: sc.color, background: sc.bg }}
            >
              {label}
            </span>
            <span className="text-xs text-gray-500">
              {RAS_TIPO_LABELS[ras.tipo as TipoRas]} · {RAS_VAGA_LABELS[ras.tipoVaga as TipoVagaRas]}
            </span>
          </div>
          <p className="text-white font-semibold truncate">{ras.local}</p>
          <p className="text-gray-400 text-sm">
            {dateToBR(ras.data)} · {ras.horaInicio}–{ras.horaFim} · {ras.duracao}h
          </p>
          {ras.status === 'realizado' && ras.expiresAt && (
            <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
              ⏳ Confirmar em: {formatCountdown(ras.expiresAt)}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-emerald-400 font-bold">{fmtBRL(ras.valorCentavos)}</p>
          <p className="text-xs text-gray-500">
            {RAS_GRADUACAO_LABELS[ras.graduacao as GraduacaoRas]?.split(' / ')[0]}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {canRealizar && (
          <button
            onClick={() => onRealizar(ras)}
            className="text-xs px-3 py-1 rounded-lg font-medium"
            style={{
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            ✅ Realizado
          </button>
        )}
        {canConfirm && (
          <button
            onClick={() => onConfirmar(ras)}
            className="text-xs px-3 py-1 rounded-lg font-medium"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            🔒 Confirmar
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => onEdit(ras)}
            className="text-xs px-3 py-1 rounded-lg font-medium"
            style={{
              background: 'rgba(96,165,250,0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(96,165,250,0.3)',
            }}
          >
            ✏️ Editar
          </button>
        )}
        {canPagamento && (
          <button
            onClick={() => onPagamento(ras)}
            className="text-xs px-3 py-1 rounded-lg font-medium"
            style={{
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            💰 Pagar
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancelar(ras)}
            className="text-xs px-3 py-1 rounded-lg font-medium"
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            ❌ Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function RasCalendar({
  competencia,
  rasList,
  onDayClick,
}: {
  competencia: string
  rasList: RasAgenda[]
  onDayClick?: (dateStr: string) => void
}) {
  const [y, m] = competencia.split('-').map(Number)
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay()
  const daysInMonth = new Date(y, m, 0).getDate()

  const byDay: Record<number, RasAgenda[]> = {}
  for (const r of rasList) {
    const d = parseInt(r.data.slice(8, 10), 10)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(r)
  }

  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const today = nowBR()

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#12122a', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((w) => (
          <div key={w} className="text-center text-xs text-gray-500 font-medium py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const dayRas = byDay[day] ?? []
          const isToday =
            today.getFullYear() === y &&
            today.getMonth() + 1 === m &&
            today.getDate() === day
          const isClickable = !!onDayClick

          return (
            <div
              key={day}
              onClick={() => {
                if (onDayClick) {
                  const dd = String(day).padStart(2, '0')
                  const mm = String(m).padStart(2, '0')
                  onDayClick(`${y}-${mm}-${dd}`)
                }
              }}
              className="relative rounded-lg p-1 flex flex-col items-center"
              style={{
                minHeight: dayRas.length ? 52 : 40,
                background: isToday
                  ? 'rgba(37,99,235,0.2)'
                  : dayRas.length
                  ? 'rgba(255,255,255,0.04)'
                  : 'transparent',
                border: isToday
                  ? '1px solid rgba(37,99,235,0.5)'
                  : '1px solid transparent',
                cursor: isClickable ? 'pointer' : 'default',
              }}
            >
              <span
                className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}
              >
                {day}
              </span>
              <div className="flex flex-col gap-0.5 mt-0.5 w-full items-center">
                {dayRas.map((r, i) => {
                  const isVol = r.tipo === 'voluntario'
                  return (
                    <span
                      key={i}
                      className="text-[9px] font-bold px-1 rounded w-full text-center truncate leading-tight"
                      style={{
                        background: isVol ? 'rgba(96,165,250,0.2)' : 'rgba(245,158,11,0.2)',
                        color: isVol ? '#93c5fd' : '#fcd34d',
                      }}
                      title={`${isVol ? 'Voluntário' : 'Compulsório'} ${r.duracao}h`}
                    >
                      {isVol ? 'V' : 'C'} {r.duracao}h
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div
        className="flex gap-4 mt-3 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#60a5fa' }} />
          <span className="text-xs text-gray-400">V = Voluntário</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          <span className="text-xs text-gray-400">C = Compulsório</span>
        </div>
      </div>
    </div>
  )
}

// ─── Gráficos Tab ─────────────────────────────────────────────────────────────

function GraficosTab({ competencia }: { competencia: string }) {
  const months = Array.from({ length: 6 }, (_, i) => addMonths(competencia, i - 5))

  const [chartData, setChartData] = useState<
    Array<{ mes: string; horas: number; valor: number }>
  >([])

  useEffect(() => {
    let cancelled = false
    Promise.all(
      months.map(async (m) => {
        try {
          const s = await fetchStats(m)
          return { mes: fmtCompetencia(m), horas: s.totalHoras, valor: s.totalCentavos / 100 }
        } catch {
          return { mes: fmtCompetencia(m), horas: 0, valor: 0 }
        }
      })
    ).then((data) => {
      if (!cancelled) setChartData(data)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competencia])

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-4"
        style={{ background: '#12122a', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Horas por Mês (últimos 6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(v) => [`${v ?? 0}h`, 'Horas']}
            />
            <Bar dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="rounded-xl p-4"
        style={{ background: '#12122a', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Valor por Mês (últimos 6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(v) => `R$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(v) => [
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(v ?? 0)),
                'Valor',
              ]}
            />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
            <Bar dataKey="valor" name="Valor (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RasPage() {
  const qc = useQueryClient()
  const now = nowBR()
  const currentComp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [competencia, setCompetencia] = useState(currentComp)
  const [tab, setTab] = useState<'agenda' | 'historico' | 'graficos'>('agenda')

  // ── Toast system ─────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'error' | 'warning' }>>([])
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  const [modalForm, setModalForm] = useState<{
    open: boolean
    initial?: RasAgenda | null
    prefillDate?: string
  }>({ open: false })
  const [modalConfirmar, setModalConfirmar] = useState<RasAgenda | null>(null)
  const [modalPagamento, setModalPagamento] = useState<RasAgenda | null>(null)
  const [tick, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 60000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  const { data: stats } = useQuery({
    queryKey: ['ras-stats', competencia],
    queryFn: () => fetchStats(competencia),
  })

  const { data: rasData, isLoading } = useQuery({
    queryKey: ['ras', competencia, 'agenda'],
    queryFn: () => fetchRas({ competencia, pageSize: '200' }),
  })

  const { data: histData } = useQuery({
    queryKey: ['ras', 'historico'],
    queryFn: () => fetchRas({ pageSize: '100' }),
    enabled: tab === 'historico',
  })

  const rasList = rasData?.rasAgendas ?? []
  const histList = histData?.rasAgendas ?? []

  const realizadosPendentes = rasList.filter(
    (r) => r.status === 'realizado' && r.expiresAt
  )

  // Urgência por horas decorridas desde o evento (para card 4 níveis)
  function getUrgencia(r: RasAgenda): { label: string; color: string; emoji: string; horasDecorridas: number } {
    const eventStart = new Date(`${r.data.slice(0, 10)}T${r.horaInicio}:00`)
    const horasDecorridas = Math.floor((Date.now() - eventStart.getTime()) / 3600000)
    if (horasDecorridas >= 60) return { label: 'Crítica', color: '#ef4444', emoji: '🔴', horasDecorridas }
    if (horasDecorridas >= 36) return { label: 'Alta', color: '#f59e0b', emoji: '🟡', horasDecorridas }
    if (horasDecorridas >= 12) return { label: 'Média', color: '#3b82f6', emoji: '🔵', horasDecorridas }
    return { label: 'Baixa', color: '#10b981', emoji: '🟢', horasDecorridas }
  }

  const realizarMutation = useMutation({
    mutationFn: (id: string) => updateRas(id, { status: 'realizado' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ras'] })
      qc.invalidateQueries({ queryKey: ['ras-stats'] })
      showToast('✅ RAS marcado como realizado!')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => deleteRas(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ras'] })
      qc.invalidateQueries({ queryKey: ['ras-stats'] })
      showToast('❌ RAS cancelado', 'warning')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const totalHoras = stats?.totalHoras ?? 0
  const pct = stats?.percentualLimite ?? 0
  const alerta = stats?.alertaLimite ?? false

  const prevMes = useCallback(() => setCompetencia((c) => addMonths(c, -1)), [])
  const nextMes = useCallback(() => setCompetencia((c) => addMonths(c, 1)), [])

  return (
    <div className="min-h-screen" style={{ background: '#0f0f1a', color: '#fff' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">RAS</h1>
            <p className="text-sm text-gray-400">Regime Adicional de Serviço</p>
          </div>
          <button
            onClick={() => setModalForm({ open: true, initial: null })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
          >
            + Agendar RAS
          </button>
        </div>

        {/* ── Navegação de Mês ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between rounded-2xl p-4 mb-5"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={prevMes}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{fmtCompetencia(competencia)}</p>
            <p className="text-xs text-gray-500">
              {totalHoras}h de {RAS_MAX_MONTHLY_HOURS}h · {stats?.totalEventos ?? 0} eventos
            </p>
          </div>
          <button
            onClick={nextMes}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            ›
          </button>
        </div>

        {/* ── KPI Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Barra de horas */}
          <div
            className="rounded-xl p-4 col-span-2"
            style={{
              background: '#1a1a2e',
              border: `1px solid ${alerta ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-gray-400">Horas do Mês</span>
              <span className={`text-xl font-bold ${alerta ? 'text-red-400' : 'text-white'}`}>
                {totalHoras}h
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: alerta
                    ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                    : pct >= 80
                    ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                    : 'linear-gradient(90deg,#3b82f6,#2563eb)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{pct}% do limite</span>
              <span className="text-xs text-gray-500">
                {stats?.horasRestantes ?? RAS_MAX_MONTHLY_HOURS}h restantes
              </span>
            </div>
            {alerta && (
              <p className="text-xs text-red-400 mt-1">
                ⚠️ Atenção: {RAS_WARNING_THRESHOLD}h de aviso ultrapassadas
              </p>
            )}
          </div>

          {/* Valor Total */}
          <div
            className="rounded-xl p-4"
            style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-gray-400 mb-1">Valor Total</p>
            <p className="text-lg font-bold text-emerald-400">
              {fmtBRL(stats?.totalCentavos ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats?.totalEventos ?? 0} eventos</p>
          </div>

          {/* Aguardando Pgto */}
          <div
            className="rounded-xl p-4"
            style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-gray-400 mb-1">Aguardando Pgto</p>
            <p className="text-lg font-bold text-amber-400">
              {fmtBRL(
                (stats?.centavosPorStatus?.pendente ?? 0) +
                  (stats?.centavosPorStatus?.realizado ?? 0)
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(stats?.contagemPorStatus?.pendente ?? 0) +
                (stats?.contagemPorStatus?.realizado ?? 0)}{' '}
              eventos
            </p>
          </div>

          {/* Vol / Comp */}
          <div
            className="rounded-xl p-4 col-span-2"
            style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-gray-400 mb-3">Distribuição por Tipo</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {rasList.filter((r) => r.tipo === 'voluntario').length} vol
                  </p>
                  <p className="text-xs text-gray-500">Voluntários</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {rasList.filter((r) => r.tipo === 'compulsorio').length} comp
                  </p>
                  <p className="text-xs text-gray-500">Compulsórios</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Warning: 72h countdown ───────────────────────────────────── */}
        {/* ── 3 Status Panels ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))' }}>
          {/* Painel 1: Este Mês */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.25)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#a78bfa' }}>
              📅 {fmtCompetencia(competencia)} — Em Andamento
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['agendado','realizado','pendente','confirmado'] as const).map((s) => {
                const h = stats?.horasPorStatus?.[s] ?? 0
                const sc = RAS_STATUS_COLORS[s]
                return (
                  <div key={s} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="text-[10px] text-gray-400 capitalize mb-0.5">{s}</div>
                    <div className="text-base font-bold" style={{ color: sc.color }}>{h}h</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Painel 2: A Receber */}
          {(() => {
            const proxComp = addMonths(competencia, 1)
            const [py, pm] = proxComp.split('-').map(Number)
            const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
            const horasConf = stats?.horasPorStatus?.confirmado ?? 0
            const valorConf = stats?.centavosPorStatus?.confirmado ?? 0
            return (
              <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#34d399' }}>
                  💰 {meses[pm - 1]} {py} — A Receber
                </p>
                <div className="text-center mb-2">
                  <div className="text-2xl font-black" style={{ color: '#10b981' }}>{fmtBRL(valorConf)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{horasConf}h confirmadas este mês</div>
                </div>
                <div className="text-xs text-center mt-2" style={{ color: '#6ee7b7' }}>
                  📅 Pagamento previsto até <strong>15/{String(pm).padStart(2,'0')}/{py}</strong>
                </div>
              </div>
            )
          })()}

          {/* Painel 3: Histórico 3 Meses */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#93c5fd' }}>
              📊 Histórico — Últimos 3 Meses
            </p>
            <div className="space-y-2">
              {(stats?.historico3Meses ?? []).map((h) => (
                <div key={h.competencia} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{fmtCompetencia(h.competencia)}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{fmtBRL(h.totalCentavos)}</span>
                    <span className="text-[10px] text-gray-500 ml-1">({h.totalHoras}h)</span>
                  </div>
                </div>
              ))}
              {(stats?.historico3Meses ?? []).length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">Sem histórico ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Card RAS Não Confirmados (4 níveis de urgência) ─────────────── */}
        {realizadosPendentes.length > 0 && (
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.4)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-400">
                  {realizadosPendentes.length} RAS Não Confirmado{realizadosPendentes.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">Contando as 72h agora</p>
              </div>
            </div>
            <div className="space-y-2">
              {realizadosPendentes.slice(0, 5).map((r) => {
                const urg = getUrgencia(r)
                return (
                  <div key={r.id} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-200">📅 {dateToBR(r.data)}</span>
                      <span className="text-xs font-bold" style={{ color: urg.color }}>
                        {urg.emoji} {urg.horasDecorridas}h / 72h
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{r.duracao}h · {r.graduacao} · Urgência: {urg.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div
          className="flex rounded-xl p-1 mb-5"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {(['agenda', 'historico', 'graficos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
              style={
                tab === t
                  ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff' }
                  : { color: '#9ca3af' }
              }
            >
              {t === 'agenda' ? '📅 Agenda' : t === 'historico' ? '📋 Histórico' : '📊 Gráficos'}
            </button>
          ))}
        </div>

        {/* ── Tab: Agenda ───────────────────────────────────────────────── */}
        {tab === 'agenda' && (
          <div className="space-y-4">
            <RasCalendar
              competencia={competencia}
              rasList={rasList}
              onDayClick={(dateStr) => setModalForm({ open: true, initial: null, prefillDate: dateStr })}
            />

            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                RAS do Mês · {fmtCompetencia(competencia)}
              </h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl h-24 animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                  ))}
                </div>
              ) : rasList.filter((r) => r.status !== 'cancelado').length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{
                    background: '#12122a',
                    border: '1px dashed rgba(255,255,255,0.1)',
                  }}
                >
                  <p className="text-gray-500 text-sm">Nenhum RAS agendado neste mês</p>
                  <button
                    onClick={() => setModalForm({ open: true, initial: null })}
                    className="mt-3 text-sm text-blue-400 underline"
                  >
                    Agendar agora
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rasList
                    .filter((r) => r.status !== 'cancelado')
                    .sort((a, b) => a.data.localeCompare(b.data))
                    .map((r) => (
                      <RasCard
                        key={r.id}
                        ras={r}
                        tick={tick}
                        onEdit={(ras) => setModalForm({ open: true, initial: ras })}
                        onConfirmar={(ras) => setModalConfirmar(ras)}
                        onRealizar={(ras) => realizarMutation.mutate(ras.id)}
                        onPagamento={(ras) => setModalPagamento(ras)}
                        onCancelar={(ras) => {
                          if (confirm('Cancelar este RAS?'))
                            cancelarMutation.mutate(ras.id)
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Histórico ────────────────────────────────────────────── */}
        {tab === 'historico' && (
          <div>
            <div
              className="rounded-xl overflow-x-auto"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <table className="w-full text-sm" style={{ minWidth: 680 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">Data</th>
                    <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">Início</th>
                    <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">Dur.</th>
                    <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">Tipo</th>
                    <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">Grad.</th>
                    <th className="text-left text-gray-400 font-medium px-3 py-3 text-xs">Local</th>
                    <th className="text-right text-gray-400 font-medium px-3 py-3 text-xs">Valor</th>
                    <th className="text-center text-gray-400 font-medium px-3 py-3 text-xs">Status</th>
                    <th className="text-center text-gray-400 font-medium px-3 py-3 text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {histList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-gray-500 py-8">
                        Nenhum registro encontrado
                      </td>
                    </tr>
                  ) : (
                    histList
                      .sort((a, b) => b.data.localeCompare(a.data))
                      .map((r, idx) => {
                        const sc = RAS_STATUS_COLORS[r.status as StatusRas]
                        const isVol = r.tipo === 'voluntario'
                        const isTitular = r.tipoVaga === 'titular'
                        return (
                          <tr
                            key={r.id}
                            style={{ background: idx % 2 === 0 ? '#12122a' : 'transparent' }}
                          >
                            <td className="px-3 py-2.5 text-gray-300 text-xs whitespace-nowrap">{dateToBR(r.data)}</td>
                            <td className="px-3 py-2.5 text-gray-400 text-xs">{r.horaInicio}</td>
                            <td className="px-3 py-2.5 text-gray-400 text-xs">{r.duracao}h</td>
                            <td className="px-3 py-2.5 text-xs">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={isVol
                                  ? { background: 'rgba(139,92,246,.15)', color: '#a78bfa' }
                                  : { background: 'rgba(245,158,11,.15)', color: '#fbbf24' }}
                              >
                                {isVol ? '✋ V' : '⚡ C'} - {isTitular ? 'T' : 'R'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-gray-400 text-xs">{r.graduacao}</td>
                            <td className="px-3 py-2.5 text-gray-400 text-xs max-w-[120px] truncate">{r.local.split(' - ')[0]}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-400 font-medium text-xs whitespace-nowrap">{fmtBRL(r.valorCentavos)}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: sc.color, background: sc.bg }}>
                                {RAS_STATUS_LABELS[r.status as StatusRas]}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex gap-1 justify-center flex-wrap">
                                {r.status === 'agendado' && (
                                  <>
                                    <button
                                      onClick={() => setModalForm({ open: true, initial: r })}
                                      className="text-[10px] px-2 py-0.5 rounded"
                                      style={{ background: 'rgba(96,165,250,.2)', color: '#60a5fa' }}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => { if (confirm('Cancelar este RAS?')) cancelarMutation.mutate(r.id) }}
                                      className="text-[10px] px-2 py-0.5 rounded"
                                      style={{ background: 'rgba(239,68,68,.2)', color: '#f87171' }}
                                    >
                                      ❌
                                    </button>
                                  </>
                                )}
                                {(r.status === 'pendente') && (
                                  <>
                                    <button
                                      onClick={() => realizarMutation.mutate(r.id)}
                                      className="text-[10px] px-2 py-0.5 rounded"
                                      style={{ background: 'rgba(34,197,94,.2)', color: '#4ade80' }}
                                    >
                                      ✅
                                    </button>
                                    <button
                                      onClick={() => setModalConfirmar(r)}
                                      className="text-[10px] px-2 py-0.5 rounded"
                                      style={{ background: 'rgba(16,185,129,.2)', color: '#34d399' }}
                                    >
                                      🔒
                                    </button>
                                  </>
                                )}
                                {r.status === 'realizado' && (
                                  <button
                                    onClick={() => setModalConfirmar(r)}
                                    className="text-[10px] px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(16,185,129,.2)', color: '#34d399' }}
                                  >
                                    🔒 Confirmar
                                  </button>
                                )}
                                {r.status === 'confirmado' && (
                                  <a
                                    href={`/api/ras/${r.id}/comprovante`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(37,99,235,.2)', color: '#93c5fd' }}
                                  >
                                    📥 Comprovante
                                  </a>
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

            {/* Legenda */}
            <div
              className="mt-3 rounded-xl p-3"
              style={{ background: '#12122a', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-xs font-bold text-gray-400 mb-2">Legenda:</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { badge: '✋ V - T', label: 'Voluntário Titular', isVol: true },
                  { badge: '✋ V - R', label: 'Voluntário Reserva', isVol: true },
                  { badge: '⚡ C - T', label: 'Compulsório Titular', isVol: false },
                  { badge: '⚡ C - R', label: 'Compulsório Reserva', isVol: false },
                ].map((item) => (
                  <div key={item.badge} className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap"
                      style={item.isVol
                        ? { background: 'rgba(139,92,246,.15)', color: '#a78bfa' }
                        : { background: 'rgba(245,158,11,.15)', color: '#fbbf24' }}
                    >
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Gráficos ─────────────────────────────────────────────── */}
        {tab === 'graficos' && <GraficosTab competencia={competencia} />}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {modalForm.open && (
        <ModalForm
          initial={modalForm.initial}
          competencia={competencia}
          prefillDate={modalForm.prefillDate}
          onClose={() => setModalForm({ open: false })}
          onSaved={() => {
            setModalForm({ open: false })
            showToast('✅ RAS salvo com sucesso!')
          }}
        />
      )}
      {modalConfirmar && (
        <ModalConfirmar
          ras={modalConfirmar}
          onClose={() => setModalConfirmar(null)}
          onConfirmed={() => {
            setModalConfirmar(null)
            showToast('🔒 RAS confirmado com sucesso!')
          }}
        />
      )}
      {modalPagamento && (
        <ModalPagamento
          ras={modalPagamento}
          onClose={() => setModalPagamento(null)}
          onSaved={() => {
            setModalPagamento(null)
            showToast('💰 Pagamento registrado!')
          }}
        />
      )}

      {/* ── Toast notifications ─────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 right-4 z-[200] flex flex-col gap-2"
        style={{ pointerEvents: 'none', maxWidth: 320 }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
            style={{
              background: t.type === 'success'
                ? 'rgba(16,185,129,0.95)'
                : t.type === 'error'
                ? 'rgba(239,68,68,0.95)'
                : 'rgba(245,158,11,0.95)',
              color: '#fff',
              border: `1px solid ${t.type === 'success' ? 'rgba(52,211,153,.4)' : t.type === 'error' ? 'rgba(248,113,113,.4)' : 'rgba(252,211,77,.4)'}`,
              animation: 'slideUp 0.3s ease',
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
