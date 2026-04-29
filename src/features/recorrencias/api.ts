import type {
  CreateRecorrenciaInput,
  ProcessarRecorrenciasResult,
  RecorrenciaDTO,
  UpdateRecorrenciaInput,
} from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

export async function listRecorrencias(): Promise<RecorrenciaDTO[]> {
  const res = await fetch('/api/recorrencias')
  return handle<RecorrenciaDTO[]>(res)
}

export async function createRecorrencia(
  input: CreateRecorrenciaInput,
): Promise<RecorrenciaDTO> {
  const res = await fetch('/api/recorrencias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<RecorrenciaDTO>(res)
}

export async function updateRecorrencia(
  id: string,
  input: UpdateRecorrenciaInput,
): Promise<RecorrenciaDTO> {
  const res = await fetch(`/api/recorrencias/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<RecorrenciaDTO>(res)
}

export async function toggleRecorrencia(id: string): Promise<RecorrenciaDTO> {
  const res = await fetch(`/api/recorrencias/${encodeURIComponent(id)}/toggle`, {
    method: 'PATCH',
  })
  return handle<RecorrenciaDTO>(res)
}

export async function processarRecorrencias(): Promise<ProcessarRecorrenciasResult> {
  const res = await fetch('/api/recorrencias/processar', { method: 'POST' })
  return handle<ProcessarRecorrenciasResult>(res)
}
