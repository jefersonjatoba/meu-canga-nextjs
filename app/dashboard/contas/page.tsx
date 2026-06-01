'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ContasHeader } from '@/features/contas/components/ContasHeader'
import { ContasKpiBar } from '@/features/contas/components/ContasKpiBar'
import { ContasList } from '@/features/contas/components/ContasList'
import { ContasDesativadas } from '@/features/contas/components/ContasDesativadas'
import { ContaModal } from '@/features/contas/components/ContaModal'
import { ativarConta, desativarConta, excluirConta, listContas, listContasInativas } from '@/features/contas/api'
import type { ContaDTO } from '@/features/contas/types'

export default function ContasPage() {
  const { toast } = useToast()

  const [contas, setContas] = useState<ContaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inativas, setInativas] = useState<ContaDTO[]>([])
  const [loadingInativas, setLoadingInativas] = useState(false)
  const [showInativas, setShowInativas] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ContaDTO | null>(null)

  const loadContas = useCallback(() => {
    setLoading(true)
    setError(null)
    listContas()
      .then(setContas)
      .catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar contas'))
      .finally(() => setLoading(false))
  }, [])

  const loadInativas = useCallback(() => {
    setLoadingInativas(true)
    listContasInativas()
      .then(setInativas)
      .catch(() => setInativas([]))
      .finally(() => setLoadingInativas(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadContas()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadContas])

  function handleToggleInativas() {
    if (!showInativas && inativas.length === 0) loadInativas()
    setShowInativas(v => !v)
  }

  const handleCreateSuccess = useCallback(() => {
    loadContas()
    toast({ type: 'success', title: 'Conta criada', description: 'A conta foi adicionada com sucesso.' })
  }, [loadContas, toast])

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null)
    loadContas()
    toast({ type: 'success', title: 'Conta atualizada' })
  }, [loadContas, toast])

  const handleDesativar = useCallback(async (conta: ContaDTO) => {
    const confirmed = window.confirm(`Desativar a conta "${conta.nome}"? Ela ficará na lista de contas desativadas e pode ser reativada a qualquer momento.`)
    if (!confirmed) return
    try {
      await desativarConta(conta.id)
      loadContas()
      // refresh inativas if section is open
      if (showInativas) loadInativas()
      toast({ type: 'success', title: 'Conta desativada', description: 'Acesse "Contas desativadas" para reativar.' })
    } catch (e) {
      toast({ type: 'error', title: 'Erro ao desativar', description: e instanceof Error ? e.message : undefined })
    }
  }, [loadContas, loadInativas, showInativas, toast])

  const handleExcluir = useCallback(async (conta: ContaDTO) => {
    const confirmed = window.confirm(
      `Excluir permanentemente "${conta.nome}"?\n\nEsta ação não pode ser desfeita. Contas com lançamentos não podem ser excluídas — use "Desativar" nesses casos.`
    )
    if (!confirmed) return
    try {
      await excluirConta(conta.id)
      setContas(current => current.filter(c => c.id !== conta.id))
      toast({ type: 'success', title: 'Conta excluída', description: `"${conta.nome}" foi removida permanentemente.` })
    } catch (e) {
      toast({ type: 'error', title: 'Não foi possível excluir', description: e instanceof Error ? e.message : undefined })
    }
  }, [toast])

  const handleReativar = useCallback(async (conta: ContaDTO) => {
    try {
      await ativarConta(conta.id)
      loadContas()
      loadInativas()
      toast({ type: 'success', title: 'Conta reativada', description: `"${conta.nome}" está ativa novamente.` })
    } catch (e) {
      toast({ type: 'error', title: 'Erro ao reativar', description: e instanceof Error ? e.message : undefined })
    }
  }, [loadContas, loadInativas, toast])

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <ContasHeader totalContas={contas.length} onNova={() => setCreateOpen(true)} />

      <ContasKpiBar contas={contas} />

      <ContasList
        contas={contas}
        loading={loading}
        error={error}
        onEdit={setEditTarget}
        onDesativar={handleDesativar}
        onExcluir={handleExcluir}
        onNova={() => setCreateOpen(true)}
      />

      <ContasDesativadas
        contas={inativas}
        onReativar={handleReativar}
        loading={loadingInativas}
        open={showInativas}
        onToggle={handleToggleInativas}
      />

      <ContaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={handleCreateSuccess}
      />
      <ContaModal
        open={!!editTarget}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
