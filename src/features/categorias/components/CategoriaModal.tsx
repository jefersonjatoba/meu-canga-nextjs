'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { CategoriaForm } from './CategoriaForm'
import type { CategoriaDTO } from '../types'

interface CategoriaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'create' | 'edit'
  initialData?: CategoriaDTO
  onSuccess: () => void
}

export function CategoriaModal({
  open,
  onOpenChange,
  mode = 'create',
  initialData,
  onSuccess,
}: CategoriaModalProps) {
  const isEdit = mode === 'edit'

  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados usados para classificar lancamentos.'
              : 'Crie uma categoria para organizar receitas, despesas e movimentos.'}
          </DialogDescription>
        </DialogHeader>
        <CategoriaForm
          mode={mode}
          initialData={initialData}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
