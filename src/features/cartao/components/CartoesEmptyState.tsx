'use client'

import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CartoesEmptyStateProps {
  variant: 'sem-cartoes' | 'sem-faturas'
  onNovaCompra?: () => void
}

export function CartoesEmptyState({ variant, onNovaCompra }: CartoesEmptyStateProps) {
  const semCartoes = variant === 'sem-cartoes'

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-[#111111]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-accent-blue dark:bg-blue-950/30">
        <CreditCard size={22} aria-hidden />
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
        {semCartoes ? 'Nenhum cartao cadastrado' : 'Nenhuma fatura encontrada'}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {semCartoes
          ? 'Crie uma conta do tipo Cartao de Credito em Contas para registrar compras.'
          : 'As faturas aparecem aqui depois que uma compra no cartao e registrada.'}
      </p>
      {!semCartoes && onNovaCompra && (
        <Button className="mt-5" variant="outline" onClick={onNovaCompra}>
          Registrar compra
        </Button>
      )}
    </div>
  )
}
