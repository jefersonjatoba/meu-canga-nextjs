import type {
  AssinaturaCartaoDTO,
  CreateAssinaturaCartaoInput,
  ProcessarAssinaturasResult,
  UpdateAssinaturaCartaoInput,
} from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error((json as { success: false; error: string }).error)
  return (json as { success: true; data: T }).data
}

export async function listAssinaturas(): Promise<AssinaturaCartaoDTO[]> {
  const res = await fetch('/api/cartao/assinaturas')
  return handle<AssinaturaCartaoDTO[]>(res)
}

export async function createAssinatura(input: CreateAssinaturaCartaoInput): Promise<AssinaturaCartaoDTO> {
  const res = await fetch('/api/cartao/assinaturas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<AssinaturaCartaoDTO>(res)
}

export async function updateAssinatura(id: string, input: UpdateAssinaturaCartaoInput): Promise<AssinaturaCartaoDTO> {
  const res = await fetch(`/api/cartao/assinaturas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<AssinaturaCartaoDTO>(res)
}

export async function toggleAssinatura(id: string): Promise<AssinaturaCartaoDTO> {
  const res = await fetch(`/api/cartao/assinaturas/${id}/toggle`, {
    method: 'PATCH',
  })
  return handle<AssinaturaCartaoDTO>(res)
}

export async function processarAssinaturas(): Promise<ProcessarAssinaturasResult> {
  const res = await fetch('/api/cartao/assinaturas/processar', {
    method: 'POST',
  })
  return handle<ProcessarAssinaturasResult>(res)
}
