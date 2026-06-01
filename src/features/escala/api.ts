import type { EscalaConfig, EscalaEntry, TipoEscala } from '@/lib/escala'
import type { EscalaConfigFormData, EscalaFormData } from './types'

export async function fetchEscalas(ano: number, mes: number): Promise<EscalaEntry[]> {
  const res = await fetch(`/api/escala?ano=${ano}&mes=${mes}`)
  if (!res.ok) throw new Error('Erro ao buscar escalas')
  const data = await res.json()
  return data.escalas
}

export async function fetchConfig(): Promise<EscalaConfig | null> {
  const res = await fetch('/api/escala/config')
  if (!res.ok) throw new Error('Erro ao buscar configuração')
  const data = await res.json()
  return data.config
}

export async function fetchProximos(): Promise<EscalaEntry[]> {
  const res = await fetch('/api/escala/proximos')
  if (!res.ok) throw new Error('Erro ao buscar próximas escalas')
  const data = await res.json()
  return data.escalas
}

export async function createEscala(form: EscalaFormData): Promise<EscalaEntry> {
  const res = await fetch('/api/escala', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao criar escala')
  }
  const data = await res.json()
  return data.escala
}

export async function updateEscala(id: string, form: Partial<EscalaFormData>): Promise<EscalaEntry> {
  const res = await fetch(`/api/escala/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao atualizar escala')
  }
  const data = await res.json()
  return data.escala
}

export async function deleteEscala(id: string): Promise<void> {
  const res = await fetch(`/api/escala/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao deletar escala')
}

export async function saveConfig(form: EscalaConfigFormData): Promise<EscalaConfig> {
  const res = await fetch('/api/escala/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Erro ao salvar configuração')
  }
  const data = await res.json()
  return data.config
}

export async function deleteAllData(): Promise<void> {
  const res = await fetch('/api/escala/config', { method: 'DELETE' })
  if (!res.ok) throw new Error('Erro ao remover dados')
}

export async function aplicarPadrao(payload: {
  dias: number[]
  ano: number
  mes: number
  horaInicio: string
  horaFim: string
  local?: string
  alarmeAtivo?: boolean
}): Promise<{ created: number; skipped: number }> {
  const res = await fetch('/api/escala/aplicar-padrao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao aplicar padrão da escala')
  }
  return res.json()
}

export async function aplicarCiclo(payload: {
  dataInicio: string
  tipo: TipoEscala
  horaInicio: string
  horaFim: string
  local?: string
  alarmeAtivo?: boolean
}): Promise<{ created: number; total: number; skipped: number }> {
  const res = await fetch('/api/escala/aplicar-ciclo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao aplicar ciclo até dezembro')
  }
  return res.json()
}
