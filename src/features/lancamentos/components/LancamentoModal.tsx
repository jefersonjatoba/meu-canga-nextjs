'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { LancamentoForm } from './LancamentoForm'
import type { ContaOption } from '../api'

interface LancamentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contas: ContaOption[]
  onSuccess: () => void
}

export function LancamentoModal({
  open,
  onOpenChange,
  contas,
  onSuccess,
}: LancamentoModalProps) {
  const handleSuccess = () => {
    onOpenChange(false)
    onSuccess()
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
          <DialogDescription>
            Registre uma receita, despesa ou outro movimento financeiro.
          </DialogDescription>
        </DialogHeader>
        <LancamentoForm
          contas={contas}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
