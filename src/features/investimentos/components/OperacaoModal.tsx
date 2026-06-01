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

type ContaOption = { id: string; nome: string; tipo: string }

interface OperacaoModalProps {
  ativo: InvestimentoAtivoDetalheDTO | null
  contas: ContaOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (ativo: InvestimentoAtivoDetalheDTO) => void
}

export function OperacaoModal({
  ativo,
  contas,
  open,
  onOpenChange,
  onSuccess,
}: OperacaoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Registrar operação</DialogTitle>
          <DialogDescription>
            A operação atualiza a posição do ativo. Se vincular uma conta, um lançamento financeiro é criado automaticamente.
          </DialogDescription>
        </DialogHeader>

        {ativo && (
          <OperacaoForm
            ativo={ativo}
            contas={contas}
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
