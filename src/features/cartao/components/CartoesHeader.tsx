'use client'

import { CreditCard, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CartoesHeaderProps {
  totalFaturas: number
  totalCartoes: number
  onNovaCompra: () => void
  onNovaAssinatura: () => void
}

export function CartoesHeader({ totalFaturas, totalCartoes, onNovaCompra, onNovaAssinatura }: CartoesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-accent-blue dark:bg-blue-950/30">
            <CreditCard size={18} aria-hidden />
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cartões</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {totalCartoes === 0
            ? 'Nenhum cartão de crédito ativo encontrado'
            : `${totalFaturas} fatura${totalFaturas !== 1 ? 's' : ''} em ${totalCartoes} cartão${totalCartoes !== 1 ? 'ões' : ''}`}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={onNovaAssinatura} disabled={totalCartoes === 0}>
          <RefreshCw size={16} className="mr-1.5" aria-hidden />
          Nova assinatura
        </Button>
        <Button variant="primary" onClick={onNovaCompra} disabled={totalCartoes === 0}>
          <Plus size={16} className="mr-1.5" aria-hidden />
          Adicionar compra no cartão
        </Button>
      </div>
    </div>
  )
}
