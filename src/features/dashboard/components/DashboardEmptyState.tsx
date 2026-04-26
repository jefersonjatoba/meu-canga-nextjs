import Link from 'next/link'
import { BarChart3, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export function DashboardEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] px-8 py-14 flex flex-col items-center text-center gap-6">
      {/* Illustration area */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
          <BarChart3 size={28} className="text-gray-300 dark:text-gray-600" aria-hidden />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-green-400/40 dark:bg-green-500/30 border border-green-300/60 dark:border-green-500/40" />
        <div className="absolute -bottom-1 -left-1.5 w-3 h-3 rounded-full bg-blue-400/40 dark:bg-blue-500/30 border border-blue-300/60 dark:border-blue-500/40" />
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-sm">
        <p className="font-semibold text-gray-800 dark:text-gray-200 text-base">
          Seu painel financeiro está esperando você.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
          Registre receitas e despesas para visualizar seu saldo, taxa de poupança e evolução
          financeira automaticamente.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard/lancamentos"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium transition-colors"
        >
          <ArrowDownLeft size={15} aria-hidden />
          Registrar receita
        </Link>
        <Link
          href="/dashboard/lancamentos"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
        >
          <ArrowUpRight size={15} aria-hidden />
          Registrar despesa
        </Link>
      </div>
    </div>
  )
}
