'use client'

import { LineChart, Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'

interface InvestimentosEmptyStateProps {
  onNovoAtivo: () => void
}

export function InvestimentosEmptyState({ onNovoAtivo }: InvestimentosEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center dark:border-white/[0.08] dark:bg-[#1A1A1A]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
        <LineChart size={22} aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Você ainda não possui investimentos cadastrados
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        Comece adicionando um ativo. Depois registre compras e vendas para acompanhar posição, preço médio e resultado.
      </p>
      <Button type="button" className="mt-5" onClick={onNovoAtivo}>
        <Plus size={16} aria-hidden />
        Adicionar ativo
      </Button>
    </div>
  )
}
