'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { CategoriasHeader } from '@/features/categorias/components/CategoriasHeader'
import { CategoriasList } from '@/features/categorias/components/CategoriasList'
import { CategoriaModal } from '@/features/categorias/components/CategoriaModal'
import { desativarCategoria, listCategorias } from '@/features/categorias/api'
import type { CategoriaDTO, TipoCategoria } from '@/features/categorias/types'

export default function CategoriasPage() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([])
  const [tipo, setTipo] = useState<TipoCategoria | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CategoriaDTO | null>(null)

  const loadCategorias = useCallback(() => {
    setLoading(true)
    setError(null)

    listCategorias()
      .then(setCategorias)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar categorias')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCategorias()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadCategorias])

  const filteredCategorias = useMemo(() => {
    if (tipo === 'all') return categorias
    return categorias.filter((categoria) => categoria.tipo === tipo)
  }, [categorias, tipo])

  const handleCreateSuccess = useCallback(() => {
    loadCategorias()
    toast({ type: 'success', title: 'Categoria criada', description: 'A categoria foi adicionada com sucesso.' })
  }, [loadCategorias, toast])

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null)
    loadCategorias()
    toast({ type: 'success', title: 'Categoria atualizada', description: 'As alteracoes foram salvas.' })
  }, [loadCategorias, toast])

  const handleDesativar = useCallback(async (categoria: CategoriaDTO) => {
    const confirmed = window.confirm(`Desativar a categoria "${categoria.nome}"?`)
    if (!confirmed) return

    try {
      await desativarCategoria(categoria.id)
      loadCategorias()
      toast({ type: 'success', title: 'Categoria desativada' })
    } catch (e) {
      toast({
        type: 'error',
        title: 'Erro ao desativar categoria',
        description: e instanceof Error ? e.message : 'Nao foi possivel desativar a categoria.',
      })
    }
  }, [loadCategorias, toast])

  return (
    <div className="space-y-5">
      <CategoriasHeader
        totalCategorias={filteredCategorias.length}
        tipo={tipo}
        onTipoChange={setTipo}
        onNova={() => setCreateOpen(true)}
      />

      <CategoriasList
        categorias={filteredCategorias}
        loading={loading}
        error={error}
        onEdit={setEditTarget}
        onDesativar={handleDesativar}
        onNova={() => setCreateOpen(true)}
      />

      <CategoriaModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={handleCreateSuccess}
      />

      <CategoriaModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        mode="edit"
        initialData={editTarget ?? undefined}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
