'use client'

import { Landmark, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ContasEmptyStateProps {
  onNova: () => void
}

export function ContasEmptyState({ onNova }: ContasEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-4">
        <Landmark size={28} className="text-blue-500" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Nenhuma conta cadastrada</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
        Crie sua primeira conta para organizar seus lançamentos financeiros.
      </p>
      <Button variant="primary" onClick={onNova}>
        <Plus size={16} className="mr-1.5" aria-hidden />
        Criar conta
      </Button>
    </div>
  )
}
