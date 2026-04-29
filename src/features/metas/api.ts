import type {
  CreateMetaInput,
  MetaDTO,
  RegistrarMetaAporteInput,
  UpdateMetaInput,
} from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

export async function listMetas(): Promise<MetaDTO[]> {
  const res = await fetch('/api/metas')
  return handle<MetaDTO[]>(res)
}

export async function getMeta(id: string): Promise<MetaDTO> {
  const res = await fetch(`/api/metas/${encodeURIComponent(id)}`)
  return handle<MetaDTO>(res)
}

export async function createMeta(input: CreateMetaInput): Promise<MetaDTO> {
  const res = await fetch('/api/metas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<MetaDTO>(res)
}

export async function updateMeta(id: string, input: UpdateMetaInput): Promise<MetaDTO> {
  const res = await fetch(`/api/metas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<MetaDTO>(res)
}

export async function toggleMeta(id: string): Promise<MetaDTO> {
  const res = await fetch(`/api/metas/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
  })
  return handle<MetaDTO>(res)
}

export async function registrarAporte(
  metaId: string,
  input: RegistrarMetaAporteInput,
): Promise<MetaDTO> {
  const res = await fetch(`/api/metas/${encodeURIComponent(metaId)}/aportes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<MetaDTO>(res)
}

export async function cancelarAporte(metaId: string, aporteId: string): Promise<MetaDTO> {
  const res = await fetch(
    `/api/metas/${encodeURIComponent(metaId)}/aportes/${encodeURIComponent(aporteId)}/cancelar`,
    { method: 'PATCH' },
  )
  return handle<MetaDTO>(res)
}
