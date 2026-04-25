'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  RasAgenda,
  RasAgendaFilters,
  RasMonthStats,
  CreateRasAgendaInput,
  UpdateRasAgendaInput,
  RasCenarioSalvo,
} from '@/types/ras'
import { calculateRasWarningLevel } from '@/lib/ras-calculations'

// ─── Query keys factory ───────────────────────────────────────────────────────

export const rasKeys = {
  all: ['ras'] as const,
  lists: () => [...rasKeys.all, 'list'] as const,
  list: (filters: RasAgendaFilters) => [...rasKeys.lists(), filters] as const,
  details: () => [...rasKeys.all, 'detail'] as const,
  detail: (id: string) => [...rasKeys.details(), id] as const,
  stats: (ano: number, mes: number) =>
    [...rasKeys.all, 'stats', ano, mes] as const,
  cenarios: () => [...rasKeys.all, 'cenarios'] as const,
}

// ─── API client functions ─────────────────────────────────────────────────────

interface PaginatedRasResponse {
  rasAgendas: RasAgenda[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchRasAgendamentos(
  mesAno?: string
): Promise<PaginatedRasResponse> {
  const params = new URLSearchParams()
  if (mesAno) params.set('mes', mesAno)

  const res = await fetch(`/api/ras?${params.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao listar RAS')
  return json.data
}

async function fetchRasDetail(id: string): Promise<RasAgenda> {
  const res = await fetch(`/api/ras/${id}`, {
    cache: 'no-store',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar RAS')
  return json.data
}

async function createRas(input: CreateRasAgendaInput): Promise<RasAgenda> {
  const res = await fetch('/api/ras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar RAS')
  return json.data
}

async function updateRas({
  id,
  input,
}: {
  id: string
  input: UpdateRasAgendaInput
}): Promise<RasAgenda> {
  const res = await fetch(`/api/ras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar RAS')
  return json.data
}

async function deleteRas(id: string): Promise<RasAgenda> {
  const res = await fetch(`/api/ras/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao cancelar RAS')
  return json.data
}

async function fetchRasMonthlyStats(
  ano: number,
  mes: number
): Promise<RasMonthStats> {
  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`
  const res = await fetch(`/api/ras/stats?mes=${mesAno}`, {
    cache: 'no-store',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar estatísticas RAS')
  return json.data
}

async function fetchRasCenarios(): Promise<RasCenarioSalvo[]> {
  const res = await fetch('/api/ras/cenarios', {
    cache: 'no-store',
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao listar cenários RAS')
  return json.data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List RAS agendamentos for a given month (YYYY-MM). */
export function useRasAgendamentos(
  mesAno?: string,
  options?: Partial<UseQueryOptions<PaginatedRasResponse>>
) {
  return useQuery<PaginatedRasResponse>({
    queryKey: rasKeys.list({ competencia: mesAno }),
    queryFn: () => fetchRasAgendamentos(mesAno),
    staleTime: 30_000,
    ...options,
  })
}

/** Fetch a single RAS agendamento by ID. */
export function useRasDetail(
  id: string,
  options?: Partial<UseQueryOptions<RasAgenda>>
) {
  return useQuery<RasAgenda>({
    queryKey: rasKeys.detail(id),
    queryFn: () => fetchRasDetail(id),
    enabled: !!id,
    staleTime: 30_000,
    ...options,
  })
}

/** Create a new RAS agendamento. */
export function useCreateRas(options?: {
  onSuccess?: (data: RasAgenda) => void
  onError?: (error: Error) => void
}) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: createRas,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: rasKeys.lists() })
      qc.invalidateQueries({ queryKey: rasKeys.all })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

/** Update an existing RAS agendamento. */
export function useUpdateRas(
  id: string,
  options?: {
    onSuccess?: (data: RasAgenda) => void
    onError?: (error: Error) => void
  }
) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateRasAgendaInput) => updateRas({ id, input }),
    onSuccess: (data) => {
      qc.setQueryData(rasKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: rasKeys.lists() })
      qc.invalidateQueries({ queryKey: rasKeys.stats(
        new Date().getFullYear(),
        new Date().getMonth() + 1
      ) })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

/** Soft-delete (cancel) a RAS agendamento. */
export function useDeleteRas(
  id: string,
  options?: {
    onSuccess?: (data: RasAgenda) => void
    onError?: (error: Error) => void
  }
) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => deleteRas(id),
    onSuccess: (data) => {
      qc.setQueryData(rasKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: rasKeys.lists() })
      qc.invalidateQueries({ queryKey: rasKeys.stats(
        new Date().getFullYear(),
        new Date().getMonth() + 1
      ) })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

/** Fetch monthly statistics plus a derived warning level. */
export function useRasMonthlyStats(ano: number, mes: number) {
  return useQuery<RasMonthStats & { warningLevel: 'normal' | 'warning' | 'critical' }>({
    queryKey: rasKeys.stats(ano, mes),
    queryFn: async () => {
      const stats = await fetchRasMonthlyStats(ano, mes)
      return {
        ...stats,
        warningLevel: calculateRasWarningLevel(stats.totalHoras),
      }
    },
    staleTime: 60_000,
  })
}

/** List all saved RAS scenarios for the current user. */
export function useRasCenarios(
  options?: Partial<UseQueryOptions<RasCenarioSalvo[]>>
) {
  return useQuery<RasCenarioSalvo[]>({
    queryKey: rasKeys.cenarios(),
    queryFn: fetchRasCenarios,
    staleTime: 60_000,
    ...options,
  })
}
