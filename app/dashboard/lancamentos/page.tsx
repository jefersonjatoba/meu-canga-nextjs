'use client'

import { useEffect, useState, useCallback } from 'react'
import { LancamentosHeader } from '@/features/lancamentos/components/LancamentosHeader'
import { LancamentosFilters } from '@/features/lancamentos/components/LancamentosFilters'
import { LancamentosList } from '@/features/lancamentos/components/LancamentosList'
import { LancamentoModal } from '@/features/lancamentos/components/LancamentoModal'
import {
  listLancamentos,
  getLancamentosSummary,
  deleteLancamento,
  listContas,
} from '@/features/lancamentos/api'
import type { LancamentoAPIItem, ContaOption } from '@/features/lancamentos/api'
import type { LancamentoSummaryDTO } from '@/features/lancamentos/types'

type TipoFilter = 'all' | 'income' | 'expense'

function currentMes(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 7)
}

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, 1))
  return d
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

export default function LancamentosPage() {
  const [mes, setMes]               = useState<string>(currentMes)
  const [tipo, setTipo]             = useState<TipoFilter>('all')
  const [items, setItems]           = useState<LancamentoAPIItem[]>([])
  const [total, setTotal]           = useState(0)
  const [summary, setSummary]       = useState<LancamentoSummaryDTO | null>(null)
  const [contas, setContas]         = useState<ContaOption[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [modalOpen, setModalOpen]   = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch list + summary
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      listLancamentos({ mes, tipo, pageSize: 50 }),
      getLancamentosSummary(mes),
    ])
      .then(([listResult, summaryResult]) => {
        if (cancelled) return
        setItems(listResult.items)
        setTotal(listResult.total)
        setSummary(summaryResult)
      })
      .catch(e => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Erro ao carregar lançamentos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [mes, tipo, refreshKey])

  // Fetch accounts once on mount
  useEffect(() => {
    listContas()
      .then(setContas)
      .catch(() => {}) // non-blocking — form shows error if contas empty
  }, [])

  const refetch = useCallback(() => setRefreshKey(k => k + 1), [])

  const handleDelete = useCallback(async (id: string) => {
    await deleteLancamento(id)
    refetch()
  }, [refetch])

  const periodoLabel = formatMesLabel(mes)

  return (
    <div className="space-y-5">
      <LancamentosHeader
        periodoLabel={periodoLabel}
        summary={summary}
        onNovo={() => setModalOpen(true)}
      />

      <LancamentosFilters
        mes={mes}
        tipo={tipo}
        onMesChange={setMes}
        onTipoChange={setTipo}
      />

      <LancamentosList
        items={items}
        total={total}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onNovo={() => setModalOpen(true)}
      />

      <LancamentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contas={contas}
        onSuccess={refetch}
      />
    </div>
  )
}
