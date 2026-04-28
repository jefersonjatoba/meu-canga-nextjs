import type {
  CategoriaDTO,
  CategoriaFilters,
  CreateCategoriaInput,
  UpdateCategoriaInput,
} from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

export async function listCategorias(filters: CategoriaFilters = {}): Promise<CategoriaDTO[]> {
  const qs = new URLSearchParams()
  if (filters.tipo) qs.set('tipo', filters.tipo)
  if (filters.includeInactive) qs.set('includeInactive', String(filters.includeInactive))

  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const res = await fetch(`/api/categorias${suffix}`)
  return handle<CategoriaDTO[]>(res)
}

export async function createCategoria(input: CreateCategoriaInput): Promise<CategoriaDTO> {
  const res = await fetch('/api/categorias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<CategoriaDTO>(res)
}

export async function updateCategoria(
  id: string,
  input: UpdateCategoriaInput,
): Promise<CategoriaDTO> {
  const res = await fetch(`/api/categorias/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<CategoriaDTO>(res)
}

export async function desativarCategoria(id: string): Promise<CategoriaDTO> {
  return updateCategoria(id, { ativa: false })
}
