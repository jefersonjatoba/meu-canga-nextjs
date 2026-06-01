import type {
  CriarAtivoInput,
  CriarOperacaoInput,
  InvestimentoAtivoDTO,
  InvestimentoAtivoDetalheDTO,
} from './types'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function handle<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResponse<T>
  if (!body.success) throw new Error(body.error)
  return body.data
}

export async function listarAtivosInvestimento(): Promise<InvestimentoAtivoDTO[]> {
  const res = await fetch('/api/investimentos/ativos')
  return handle<InvestimentoAtivoDTO[]>(res)
}

export async function criarAtivoInvestimento(input: CriarAtivoInput): Promise<InvestimentoAtivoDTO> {
  const res = await fetch('/api/investimentos/ativos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<InvestimentoAtivoDTO>(res)
}

export async function obterAtivoInvestimento(id: string): Promise<InvestimentoAtivoDetalheDTO> {
  const res = await fetch(`/api/investimentos/ativos/${encodeURIComponent(id)}`)
  return handle<InvestimentoAtivoDetalheDTO>(res)
}

export async function criarOperacaoInvestimento(
  ativoId: string,
  input: Omit<CriarOperacaoInput, 'ativoId'>,
): Promise<InvestimentoAtivoDetalheDTO> {
  const res = await fetch(`/api/investimentos/ativos/${encodeURIComponent(ativoId)}/operacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handle<InvestimentoAtivoDetalheDTO>(res)
}

export async function excluirAtivoInvestimento(id: string): Promise<void> {
  const res = await fetch(`/api/investimentos/ativos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await handle<{ deleted: boolean }>(res)
}

export async function cancelarOperacaoInvestimento(id: string): Promise<InvestimentoAtivoDetalheDTO> {
  const res = await fetch(`/api/investimentos/operacoes/${encodeURIComponent(id)}/cancelar`, {
    method: 'PATCH',
  })
  return handle<InvestimentoAtivoDetalheDTO>(res)
}
