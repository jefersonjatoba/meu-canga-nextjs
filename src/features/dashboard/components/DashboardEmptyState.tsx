import { Inbox } from 'lucide-react'

export function DashboardEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] p-12 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <Inbox size={24} aria-hidden />
      </div>
      <p className="font-medium text-gray-700 dark:text-gray-300">
        Ainda não há lançamentos neste período.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed">
        Comece registrando uma receita ou despesa para visualizar seu painel financeiro.
      </p>
    </div>
  )
}
