'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog'
import { PagarFaturaForm } from './PagarFaturaForm'
import type { ContaDTO } from '@/features/contas/types'
import type { FaturaCartaoDTO } from '../types'

interface PagarFaturaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fatura: FaturaCartaoDTO | null
  contasPagamento: ContaDTO[]
  onSuccess: () => void
}

export function PagarFaturaModal({
  open,
  onOpenChange,
  fatura,
  contasPagamento,
  onSuccess,
}: PagarFaturaModalProps) {
  const handleSuccess = () => {
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Pagar fatura</DialogTitle>
          <DialogDescription>
            Registre o pagamento da fatura sem criar uma nova despesa.
          </DialogDescription>
        </DialogHeader>
        {fatura && (
          <PagarFaturaForm
            fatura={fatura}
            contasPagamento={contasPagamento}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
