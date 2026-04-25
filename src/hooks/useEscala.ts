'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  Escala,
  EscalaFilters,
  EscalaStats,
  CreateEscalaInput,
  UpdateEscalaInput,
  TipoCiclo,
} from '@/types/escala'
import { calculateCycleDays } from '@/lib/escala-calculations'

// ─── Query keys factory ───────────────────────────────────────────────────────

export const escalaKeys = {
  all: ['escalas'] as const,
  lists: () => [...escalaKeys.all, 'list'] as const,
  list: (filters: EscalaFilters) => [...escalaKeys.lists(), filters] as const,
  details: () => [...escalaKeys.all, 'detail'] as const,
  detail: (id: string) => [...escalaKeys.details(), id] as const,
  stats: (mes?: string) => [...escalaKeys.all, 'stats', mes] as const,
}

// ─── API client functions ─────────────────────────────────────────────────────

interface PaginatedEscalaResponse {
  escalas: Escala[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchEscalas(
  filters: EscalaFilters
): Promise<PaginatedEscalaResponse> {
  const params = new URLSearchParams()

  if (filters.mes) params.set('mes', filters.mes)
  if (filters.status && filters.status !== 'all') params.set('status', filters.status)
  if (filters.tipoPlantao && filters.tipoPlantao !== 'all') params.set('tipoPlantao', filters.tipoPlantao)
  if (filters.localServico) params.set('localServico', filters.localServico)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

  const res = await fetch(`/api/escala?${params.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao listar escalas')
  return json.data
}

async function fetchEscala(id: string): Promise<Escala> {
  const res = await fetch(`/api/escala/${id}`, { cache: 'no-store', credentials: 'include' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar escala')
  return json.data
}

async function fetchEscalaStats(mes?: string): Promise<EscalaStats> {
  const url = mes ? `/api/escala/stats?mes=${mes}` : '/api/escala/stats'
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar estatísticas')
  return json.data
}

async function createEscala(input: CreateEscalaInput): Promise<Escala> {
  const res = await fetch('/api/escala', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar escala')
  return json.data
}

async function updateEscala({
  id,
  input,
}: {
  id: string
  input: UpdateEscalaInput
}): Promise<Escala> {
  const res = await fetch(`/api/escala/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar escala')
  return json.data
}

async function deleteEscala(id: string): Promise<Escala> {
  const res = await fetch(`/api/escala/${id}`, { method: 'DELETE', credentials: 'include' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao cancelar escala')
  return json.data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useEscalaList(
  filters: EscalaFilters = {},
  options?: Partial<UseQueryOptions<PaginatedEscalaResponse>>
) {
  return useQuery<PaginatedEscalaResponse>({
    queryKey: escalaKeys.list(filters),
    queryFn: () => fetchEscalas(filters),
    staleTime: 30_000,
    ...options,
  })
}

export function useEscalaDetail(
  id: string,
  options?: Partial<UseQueryOptions<Escala>>
) {
  return useQuery<Escala>({
    queryKey: escalaKeys.detail(id),
    queryFn: () => fetchEscala(id),
    enabled: !!id,
    staleTime: 30_000,
    ...options,
  })
}

export function useEscalaStats(mes?: string) {
  return useQuery<EscalaStats>({
    queryKey: escalaKeys.stats(mes),
    queryFn: () => fetchEscalaStats(mes),
    staleTime: 60_000,
  })
}

export function useEscalaCreate() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: createEscala,
    onSuccess: () => {
      // Invalidate all list queries and stats
      qc.invalidateQueries({ queryKey: escalaKeys.lists() })
      qc.invalidateQueries({ queryKey: escalaKeys.all })
    },
  })
}

export function useEscalaUpdate() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: updateEscala,
    onSuccess: (data) => {
      qc.setQueryData(escalaKeys.detail(data.id), data)
      qc.invalidateQueries({ queryKey: escalaKeys.lists() })
      qc.invalidateQueries({ queryKey: escalaKeys.stats() })
    },
  })
}

export function useEscalaDelete() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: deleteEscala,
    onSuccess: (data) => {
      qc.setQueryData(escalaKeys.detail(data.id), data)
      qc.invalidateQueries({ queryKey: escalaKeys.lists() })
      qc.invalidateQueries({ queryKey: escalaKeys.stats() })
    },
  })
}

// ─── useCycleDays ─────────────────────────────────────────────────────────────

const cycleDaysKeys = {
  all: ['cycleDays'] as const,
  month: (tipoCiclo: TipoCiclo, dataInicio: Date, mes: number, ano: number) =>
    [...cycleDaysKeys.all, tipoCiclo, dataInicio.toISOString(), mes, ano] as const,
}

/**
 * Query hook that calculates which days of a given month the user works,
 * based purely on cycle arithmetic (no API call required).
 *
 * @param tipoCiclo   - The user's cycle type
 * @param dataInicio  - The reference start date for the cycle
 * @param mes         - Month (1-based)
 * @param ano         - Full year (e.g. 2026)
 * @returns           React Query result whose `data` is `number[]` (day numbers 1–31)
 */
export function useCycleDays(
  tipoCiclo?: TipoCiclo,
  dataInicio?: Date,
  mes?: number,
  ano?: number
) {
  const now = new Date()
  const resolvedMes = mes ?? now.getMonth() + 1
  const resolvedAno = ano ?? now.getFullYear()

  return useQuery<number[]>({
    queryKey: tipoCiclo && dataInicio
      ? cycleDaysKeys.month(tipoCiclo, dataInicio, resolvedMes, resolvedAno)
      : [...cycleDaysKeys.all, 'disabled'],
    queryFn: () => {
      if (!tipoCiclo || !dataInicio) return []
      return calculateCycleDays(tipoCiclo, dataInicio, resolvedAno, resolvedMes)
    },
    enabled: !!tipoCiclo && !!dataInicio,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours – pure calculation, very stable
  })
}
