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
      <DialogContent
        size="lg"
        className="max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden flex flex-col p-0"
      >
        {/* Header — fixed, does not scroll */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0">
          <DialogHeader className="mb-0">
            <DialogTitle className="text-lg sm:text-xl">
              {isEditing ? 'Editar RAS' : 'Agendar RAS'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Altere os dados do RAS e salve.'
                : 'Registre um novo Regime Adicional de Serviço.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 pb-4 sm:pb-5">
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
