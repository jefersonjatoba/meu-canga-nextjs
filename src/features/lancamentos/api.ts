// Client-side fetch helpers for the lancamentos API.
// All functions throw on non-success responses so callers can catch and display errors.

import type { LancamentoSummaryDTO, StatusLancamento, TipoLancamento } from './types'

export interface LancamentoAPIItem {
  id: string
  descricao: string
  tipo: TipoLancamento
  categoriaId?: string | null
  categoria: string
  valorCentavos: number
  data: string           // ISO datetime string from JSON
  competenciaAt: string
  status: string
  source?: string | null
  recorrenciaId?: string | null
  conta?: { id: string; nome: string; tipo: string } | null
  categoriaRef?: { id: string; nome: string; tipo: string } | null
}

export interface ListResult {
  items: LancamentoAPIItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ContaOption {
  id: string
  nome: string
  tipo: string
}

export interface CreateLancamentoPayload {
  contaId: string
  categoriaId?: string | null
  descricao: string
  tipo: TipoLancamento
  categoria: string
  valorCentavos: number
  data: string    // YYYY-MM-DD
  status?: StatusLancamento
}

export interface UpdateLancamentoPayload {
  descricao?: string
  tipo?: TipoLancamento
  categoriaId?: string | null
  categoria?: string
  valorCentavos?: number
  data?: string   // YYYY-MM-DD
  status?: StatusLancamento
}

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

export async function listLancamentos(params: {
  mes?: string
  tipo?: string
  contaId?: string
  page?: number
  pageSize?: number
}): Promise<ListResult> {
  const qs = new URLSearchParams()
  if (params.mes) qs.set('mes', params.mes)
  if (params.tipo && params.tipo !== 'all') qs.set('tipo', params.tipo)
  if (params.contaId) qs.set('contaId', params.contaId)
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  const res = await fetch(`/api/lancamentos?${qs}`)
  return handle<ListResult>(res)
}

export async function getLancamentosSummary(mes: string, contaId?: string): Promise<LancamentoSummaryDTO> {
  const qs = new URLSearchParams({ summary: '1', mes })
  if (contaId) qs.set('contaId', contaId)
  const res = await fetch(`/api/lancamentos?${qs}`)
  return handle<LancamentoSummaryDTO>(res)
}

export async function createLancamento(input: CreateLancamentoPayload, idempotencyKey?: string): Promise<LancamentoAPIItem> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey
  const res = await fetch('/api/lancamentos', {
    method:  'POST',
    headers,
    body:    JSON.stringify(input),
  })
  return handle<LancamentoAPIItem>(res)
}

export async function updateLancamento(id: string, input: UpdateLancamentoPayload): Promise<LancamentoAPIItem> {
  const res = await fetch(`/api/lancamentos/${encodeURIComponent(id)}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })
  return handle<LancamentoAPIItem>(res)
}

export async function deleteLancamento(id: string): Promise<void> {
  const res = await fetch(`/api/lancamentos/${encodeURIComponent(id)}`, { method: 'DELETE' })
  await handle<{ deleted: boolean }>(res)
}

export async function listContas(): Promise<ContaOption[]> {
  const res = await fetch('/api/contas')
  return handle<ContaOption[]>(res)
}
