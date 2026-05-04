// Client-side fetch helpers for the RAS API.
// All functions throw on non-success responses so callers can catch and display errors.

import type {
  RasAgenda,
  RasMonthStats,
  CreateRasAgendaInput,
  UpdateRasAgendaInput,
} from '@/types/ras'

// ─── Response envelope ────────────────────────────────────────────────────────

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

// ─── List / Fetch ─────────────────────────────────────────────────────────────

export interface RasListResult {
  rasAgendas: RasAgenda[]
  total: number
  totalPages: number
}

export interface FetchRasParams {
  competencia?: string
  status?: string
  graduacao?: string
  local?: string
  page?: number
  pageSize?: number
}

export async function fetchRas(params: FetchRasParams): Promise<RasListResult> {
  const qs = new URLSearchParams()
  if (params.competencia) qs.set('competencia', params.competencia)
  if (params.status && params.status !== 'all') qs.set('status', params.status)
  if (params.graduacao && params.graduacao !== 'all') qs.set('graduacao', params.graduacao)
  if (params.local) qs.set('local', params.local)
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  const res = await fetch(`/api/ras?${qs}`)
  return handle<RasListResult>(res)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchRasStats(competencia: string): Promise<RasMonthStats> {
  const res = await fetch(`/api/ras/stats?mes=${encodeURIComponent(competencia)}`)
  return handle<RasMonthStats>(res)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createRas(input: CreateRasAgendaInput): Promise<RasAgenda> {
  const res = await fetch('/api/ras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<RasAgenda>(res)
}

export async function updateRas(
  id: string,
  input: Partial<UpdateRasAgendaInput>
): Promise<RasAgenda> {
  const res = await fetch(`/api/ras/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<RasAgenda>(res)
}

export async function deleteRas(id: string): Promise<void> {
  const res = await fetch(`/api/ras/${encodeURIComponent(id)}`, { method: 'DELETE' })
  await handle<unknown>(res)
}

export async function marcarRealizado(id: string): Promise<RasAgenda> {
  return updateRas(id, { status: 'realizado' })
}

export async function confirmarRas(id: string, observacoes?: string): Promise<RasAgenda> {
  return updateRas(id, { status: 'confirmado', ...(observacoes ? { observacoes } : {}) })
}
