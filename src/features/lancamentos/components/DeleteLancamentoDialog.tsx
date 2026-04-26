'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { formatBRL } from '@/lib/money'
import type { LancamentoAPIItem } from '../api'

interface DeleteLancamentoDialogProps {
  item: LancamentoAPIItem | null
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function formatItemDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch {
    return dateStr
  }
}

export function DeleteLancamentoDialog({
  item,
  onConfirm,
  onClose,
}: DeleteLancamentoDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (!item) return
    setDeleting(true)
    try {
      await onConfirm(item.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent size="sm" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" aria-hidden />
            </div>
            <div>
              <DialogTitle>Excluir lançamento?</DialogTitle>
              <DialogDescription className="mt-0.5">
                Essa ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {item && (
          <div className="rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40 px-4 py-3 space-y-1 text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.descricao}</p>
            <div className="flex gap-3 text-gray-500 dark:text-gray-400">
              <span>{formatBRL(item.valorCentavos)}</span>
              <span>·</span>
              <span>{formatItemDate(item.data)}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={deleting}
            loadingText="Excluindo…"
            onClick={handleConfirm}
          >
            Excluir lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
