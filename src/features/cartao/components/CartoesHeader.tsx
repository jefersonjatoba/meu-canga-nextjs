'use client'

import { CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CartoesHeaderProps {
  totalFaturas: number
  totalCartoes: number
  onNovaCompra: () => void
}

export function CartoesHeader({ totalFaturas, totalCartoes, onNovaCompra }: CartoesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-accent-blue dark:bg-blue-950/30">
            <CreditCard size={18} aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cartoes</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {totalCartoes === 0
            ? 'Nenhum cartao de credito ativo encontrado'
            : `${totalFaturas} fatura${totalFaturas !== 1 ? 's' : ''} em ${totalCartoes} cartao${totalCartoes !== 1 ? 'es' : ''}`}
        </p>
      </div>

      <Button variant="primary" onClick={onNovaCompra} disabled={totalCartoes === 0}>
        <Plus size={16} className="mr-1.5" aria-hidden />
        Nova compra
      </Button>
    </div>
  )
}
