'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { CompraCartaoForm } from './CompraCartaoForm'
import type { CategoriaDTO } from '@/features/categorias/types'
import type { ContaDTO } from '@/features/contas/types'

interface CompraCartaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cartoes: ContaDTO[]
  categorias: CategoriaDTO[]
  onSuccess: () => void
}

export function CompraCartaoModal({
  open,
  onOpenChange,
  cartoes,
  categorias,
  onSuccess,
}: CompraCartaoModalProps) {
  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Adicionar compra no cartao</DialogTitle>
          <DialogDescription>
            A compra gera parcelas e lancamentos de despesa conforme a fatura.
          </DialogDescription>
        </DialogHeader>
        <CompraCartaoForm
          cartoes={cartoes}
          categorias={categorias}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
