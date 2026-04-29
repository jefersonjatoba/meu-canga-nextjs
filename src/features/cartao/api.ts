import type {
  CreateCompraCartaoInput,
  FaturaCartaoDetalheDTO,
  FaturaCartaoDTO,
  FaturaCartaoFilters,
  PagarFaturaInput,
  PagamentoFaturaDTO,
  CompraCartaoDTO,
} from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error((body as { success: false; error: string }).error)
  return (body as { success: true; data: T }).data
}

export async function criarCompraCartao(input: CreateCompraCartaoInput): Promise<CompraCartaoDTO> {
  const res = await fetch('/api/cartao/compras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<CompraCartaoDTO>(res)
}

export async function listarFaturasCartao(
  filters: FaturaCartaoFilters = {},
): Promise<FaturaCartaoDTO[]> {
  const qs = new URLSearchParams()
  if (filters.contaId) qs.set('contaId', filters.contaId)
  if (filters.status) qs.set('status', filters.status)
  if (filters.competencia) qs.set('competencia', filters.competencia)

  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  const res = await fetch(`/api/cartao/faturas${suffix}`)
  return handle<FaturaCartaoDTO[]>(res)
}

export async function obterFaturaCartao(id: string): Promise<FaturaCartaoDetalheDTO> {
  const res = await fetch(`/api/cartao/faturas/${encodeURIComponent(id)}`)
  return handle<FaturaCartaoDetalheDTO>(res)
}

export async function pagarFaturaCartao(
  id: string,
  input: Omit<PagarFaturaInput, 'faturaCartaoId'>,
): Promise<PagamentoFaturaDTO> {
  const res = await fetch(`/api/cartao/faturas/${encodeURIComponent(id)}/pagamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<PagamentoFaturaDTO>(res)
}
