import { ReceiptText } from 'lucide-react'

interface LancamentosEmptyStateProps {
  onNovo: () => void
}

export function LancamentosEmptyState({ onNovo }: LancamentosEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] px-8 py-14 flex flex-col items-center text-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
        <ReceiptText size={26} className="text-gray-300 dark:text-gray-600" aria-hidden />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="font-semibold text-gray-800 dark:text-gray-200">
          Nenhum lançamento neste período.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
          Registre receitas e despesas para acompanhar seu fluxo financeiro.
        </p>
      </div>
      <button
        onClick={onNovo}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
      >
        Novo lançamento
      </button>
    </div>
  )
}
