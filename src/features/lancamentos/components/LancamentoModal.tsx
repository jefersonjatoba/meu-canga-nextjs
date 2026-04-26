'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { LancamentoForm } from './LancamentoForm'
import type { ContaOption, LancamentoAPIItem } from '../api'

interface LancamentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: LancamentoAPIItem
  contas: ContaOption[]
  defaultTipo?: 'income' | 'expense'
  onSuccess: () => void
}

export function LancamentoModal({
  open,
  onOpenChange,
  mode = 'create',
  initialData,
  contas,
  defaultTipo,
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
          <DialogTitle>
            {mode === 'edit' ? 'Editar lançamento' : 'Novo lançamento'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Altere os dados do lançamento e salve.'
              : 'Registre uma receita, despesa ou outro movimento financeiro.'}
          </DialogDescription>
        </DialogHeader>
        <LancamentoForm
          contas={contas}
          mode={mode}
          initialData={initialData}
          defaultTipo={defaultTipo}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
