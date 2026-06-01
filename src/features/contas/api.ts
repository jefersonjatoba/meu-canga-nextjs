import type { ContaDTO, CreateContaInput, UpdateContaInput } from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

export async function listContas(): Promise<ContaDTO[]> {
  const res = await fetch('/api/contas')
  return handle<ContaDTO[]>(res)
}

export async function createConta(input: CreateContaInput): Promise<ContaDTO> {
  const res = await fetch('/api/contas', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })
  return handle<ContaDTO>(res)
}

export async function updateConta(id: string, input: UpdateContaInput): Promise<ContaDTO> {
  const res = await fetch(`/api/contas/${encodeURIComponent(id)}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })
  return handle<ContaDTO>(res)
}

export async function desativarConta(id: string): Promise<ContaDTO> {
  return updateConta(id, { ativa: false })
}

export async function ativarConta(id: string): Promise<ContaDTO> {
  return updateConta(id, { ativa: true })
}

export async function listContasInativas(): Promise<ContaDTO[]> {
  const res = await fetch('/api/contas?ativa=false')
  return handle<ContaDTO[]>(res)
}

export async function excluirConta(id: string): Promise<void> {
  const res = await fetch(`/api/contas/${encodeURIComponent(id)}`, { method: 'DELETE' })
  await handle<{ id: string }>(res)
}
