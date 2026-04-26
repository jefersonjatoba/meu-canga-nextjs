'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import { LancamentosHeader } from '@/features/lancamentos/components/LancamentosHeader'
import { LancamentosFilters } from '@/features/lancamentos/components/LancamentosFilters'
import { LancamentosList } from '@/features/lancamentos/components/LancamentosList'
import { LancamentoModal } from '@/features/lancamentos/components/LancamentoModal'
import { DeleteLancamentoDialog } from '@/features/lancamentos/components/DeleteLancamentoDialog'
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
  const { toast } = useToast()

  const [mes, setMes]               = useState<string>(currentMes)
  const [tipo, setTipo]             = useState<TipoFilter>('all')
  const [items, setItems]           = useState<LancamentoAPIItem[]>([])
  const [total, setTotal]           = useState(0)
  const [summary, setSummary]       = useState<LancamentoSummaryDTO | null>(null)
  const [contas, setContas]         = useState<ContaOption[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Modal state
  const [createOpen, setCreateOpen]         = useState(false)
  const [editTarget, setEditTarget]         = useState<LancamentoAPIItem | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<LancamentoAPIItem | null>(null)

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
      .catch(() => {})
  }, [])

  const refetch = useCallback(() => setRefreshKey(k => k + 1), [])

  const handleCreateSuccess = useCallback(() => {
    refetch()
    toast({ type: 'success', title: 'Lançamento criado', description: 'O lançamento foi registrado com sucesso.' })
  }, [refetch, toast])

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null)
    refetch()
    toast({ type: 'success', title: 'Lançamento atualizado', description: 'As alterações foram salvas.' })
  }, [refetch, toast])

  const handleDeleteConfirm = useCallback(async (id: string) => {
    try {
      await deleteLancamento(id)
      setDeleteTarget(null)
      refetch()
      toast({ type: 'success', title: 'Lançamento excluído' })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao excluir',
        description: e instanceof Error ? e.message : 'Não foi possível excluir o lançamento.',
      })
    }
  }, [refetch, toast])

  const periodoLabel = formatMesLabel(mes)

  return (
    <div className="space-y-5">
      <LancamentosHeader
        periodoLabel={periodoLabel}
        summary={summary}
        onNovo={() => setCreateOpen(true)}
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
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
        onNovo={() => setCreateOpen(true)}
      />

      {/* Modal: Novo lançamento */}
      <LancamentoModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        contas={contas}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal: Editar lançamento */}
      <LancamentoModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        contas={contas}
        onSuccess={handleEditSuccess}
      />

      {/* Dialog: Confirmar exclusão */}
      <DeleteLancamentoDialog
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
