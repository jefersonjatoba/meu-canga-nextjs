'use client'

import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RasForm } from './RasForm'
import type { RasAgenda, CreateRasAgendaInput } from '@/types/ras'

// ─── API helpers ──────────────────────────────────────────────────────────────

async function createRas(body: CreateRasAgendaInput): Promise<RasAgenda> {
  const res = await fetch('/api/ras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Erro ao criar RAS')
  return json.data
}

async function updateRas(
  id: string,
  body: Partial<CreateRasAgendaInput>
): Promise<RasAgenda> {
  const res = await fetch(`/api/ras/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Erro ao atualizar RAS')
  return json.data
}

// ─── Modal Component ──────────────────────────────────────────────────────────

interface RasModalProps {
  open: boolean
  initial?: RasAgenda | null
  prefillDate?: string
  defaultCompetencia?: string
  onClose: () => void
  onSaved?: (ras: RasAgenda) => void
  className?: string
}

export function RasModal({
  open,
  initial,
  prefillDate,
  defaultCompetencia,
  onClose,
  onSaved,
  className,
}: RasModalProps) {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (body: CreateRasAgendaInput) =>
      initial ? updateRas(initial.id, body) : createRas(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ras'] })
      qc.invalidateQueries({ queryKey: ['ras-stats'] })
      onSaved?.(data)
      onClose()
    },
  })

  const handleClose = useCallback(() => {
    if (!mutation.isPending) onClose()
  }, [mutation.isPending, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={handleClose}
    >
      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl overflow-y-auto',
          className
        )}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh',
          padding: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">
            {initial ? 'Editar RAS' : 'Agendar RAS'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <RasForm
          initial={initial}
          prefillDate={prefillDate}
          defaultCompetencia={defaultCompetencia}
          onSubmit={async (values) => {
            mutation.mutate(values)
          }}
          onCancel={handleClose}
          isLoading={mutation.isPending}
          error={mutation.error?.message ?? null}
        />
      </div>
    </div>
  )
}

export default RasModal
