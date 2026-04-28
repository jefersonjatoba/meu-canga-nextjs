'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { ContaForm } from './ContaForm'
import type { ContaDTO } from '../types'

interface ContaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: ContaDTO
  onSuccess: () => void
}

export function ContaModal({ open, onOpenChange, mode = 'create', initialData, onSuccess }: ContaModalProps) {
  const isEdit = mode === 'edit'

  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar conta' : 'Nova conta'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da conta.' : 'Preencha os dados para criar uma nova conta.'}
          </DialogDescription>
        </DialogHeader>
        <ContaForm
          mode={mode}
          initialData={initialData}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
