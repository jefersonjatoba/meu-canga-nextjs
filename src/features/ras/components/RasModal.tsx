'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { RasForm } from './RasForm'
import { createRas, updateRas } from '../api'
import type { RasAgenda, CreateRasAgendaInput } from '@/types/ras'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RasModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initial?: RasAgenda | null
  competencia: string
  prefillDate?: string
  onSaved: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RasModal({
  isOpen,
  onOpenChange,
  initial,
  competencia,
  prefillDate,
  onSaved,
}: RasModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!initial

  const handleSubmit = async (values: CreateRasAgendaInput) => {
    setIsLoading(true)
    setError(null)
    try {
      if (isEditing && initial) {
        await updateRas(initial.id, values)
      } else {
        await createRas(values)
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar RAS')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (!isLoading) onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open) }}>
      <DialogContent size="lg" className="max-h-[80vh] overflow-hidden flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <DialogHeader className="mb-0">
            <DialogTitle>
              {isEditing ? 'Editar RAS' : 'Agendar RAS'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Altere os dados do RAS e salve.'
                : 'Registre um novo Regime Adicional de Serviço.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <RasForm
            initial={initial}
            defaultCompetencia={competencia}
            prefillDate={prefillDate}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
