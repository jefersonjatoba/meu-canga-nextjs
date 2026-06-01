'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ContasHeaderProps {
  totalContas: number
  onNova: () => void
}

export function ContasHeader({ totalContas, onNova }: ContasHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {totalContas === 0
            ? 'Nenhuma conta cadastrada'
            : `${totalContas} conta${totalContas !== 1 ? 's' : ''} ativa${totalContas !== 1 ? 's' : ''}`}
        </p>
      </div>
      <Button variant="primary" onClick={onNova}>
        <Plus size={16} className="mr-1.5" aria-hidden />
        Nova conta
      </Button>
    </div>
  )
}
