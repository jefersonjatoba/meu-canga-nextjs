'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import type { InvestimentoAtivoDetalheDTO } from '../types'
import { OperacaoForm } from './OperacaoForm'

interface OperacaoModalProps {
  ativo: InvestimentoAtivoDetalheDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (ativo: InvestimentoAtivoDetalheDTO) => void
}

export function OperacaoModal({
  ativo,
  open,
  onOpenChange,
  onSuccess,
}: OperacaoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Registrar operacao</DialogTitle>
          <DialogDescription>
            Compras e vendas atualizam a posicao do ativo, sem criar lancamento financeiro.
          </DialogDescription>
        </DialogHeader>

        {ativo && (
          <OperacaoForm
            ativo={ativo}
            onSuccess={(updated) => {
              onSuccess(updated)
              onOpenChange(false)
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
