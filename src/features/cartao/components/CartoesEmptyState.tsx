'use client'

import { CreditCard, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface CartoesEmptyStateProps {
  variant: 'sem-cartoes' | 'sem-faturas'
  message?: string
  onNovaCompra?: () => void
}

export function CartoesEmptyState({ variant, message, onNovaCompra }: CartoesEmptyStateProps) {
  const semCartoes = variant === 'sem-cartoes'

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-700 dark:bg-[#111111]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-accent-blue dark:bg-blue-950/30">
        <CreditCard size={22} aria-hidden />
      </div>
      <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
        {semCartoes ? 'Voce ainda nao configurou um cartao de credito' : 'Nenhuma fatura encontrada'}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {message ?? (semCartoes
          ? 'Cadastre uma conta do tipo cartao, informe fechamento, vencimento e limite para comecar.'
          : 'As faturas aparecem aqui depois que uma compra no cartao e registrada.')}
      </p>
      {semCartoes ? (
        <Link
          href="/dashboard/contas"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-accent-blue px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
        >
            <Settings size={16} className="mr-1.5" aria-hidden />
            Configurar cartao
        </Link>
      ) : onNovaCompra && (
        <Button className="mt-5" variant="outline" onClick={onNovaCompra}>
          Adicionar compra no cartao
        </Button>
      )}
    </div>
  )
}
