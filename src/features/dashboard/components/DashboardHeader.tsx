import Link from 'next/link'
import { Plus } from 'lucide-react'

interface DashboardHeaderProps {
  periodoLabel: string
  userName?: string | null
}

export function DashboardHeader({ periodoLabel, userName }: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0]

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {firstName ? `Bom dia, ${firstName}.` : 'Painel Financeiro'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Resumo de{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{periodoLabel}</span>
        </p>
      </div>

      <Link
        href="/dashboard/lancamentos"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-colors shrink-0 self-start sm:self-auto"
      >
        <Plus size={15} aria-hidden />
        Novo lançamento
      </Link>
    </div>
  )
}
