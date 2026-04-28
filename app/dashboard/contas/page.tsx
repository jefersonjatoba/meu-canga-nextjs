'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { ContasHeader } from '@/features/contas/components/ContasHeader'
import { ContasList } from '@/features/contas/components/ContasList'
import { ContaModal } from '@/features/contas/components/ContaModal'
import { desativarConta, listContas } from '@/features/contas/api'
import type { ContaDTO } from '@/features/contas/types'

export default function ContasPage() {
  const { toast } = useToast()
  const [contas, setContas] = useState<ContaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ContaDTO | null>(null)

  const loadContas = useCallback(() => {
    setLoading(true)
    setError(null)

    listContas()
      .then(setContas)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar contas')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadContas()
  }, [loadContas])

  const handleCreateSuccess = useCallback(() => {
    loadContas()
    toast({ type: 'success', title: 'Conta criada', description: 'A conta foi adicionada com sucesso.' })
  }, [loadContas, toast])

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null)
    loadContas()
    toast({ type: 'success', title: 'Conta atualizada', description: 'As alteracoes foram salvas.' })
  }, [loadContas, toast])

  const handleDesativar = useCallback(async (conta: ContaDTO) => {
    const confirmed = window.confirm(`Desativar a conta "${conta.nome}"?`)
    if (!confirmed) return

    try {
      await desativarConta(conta.id)
      loadContas()
      toast({ type: 'success', title: 'Conta desativada' })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao desativar conta',
        description: e instanceof Error ? e.message : 'Nao foi possivel desativar a conta.',
      })
    }
  }, [loadContas, toast])

  return (
    <div className="space-y-5">
      <ContasHeader totalContas={contas.length} onNova={() => setCreateOpen(true)} />

      <ContasList
        contas={contas}
        loading={loading}
        error={error}
        onEdit={setEditTarget}
        onDesativar={handleDesativar}
        onNova={() => setCreateOpen(true)}
      />

      <ContaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={handleCreateSuccess}
      />

      <ContaModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
