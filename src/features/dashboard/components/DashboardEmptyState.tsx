import Link from 'next/link'
import { ArrowDownLeft, ArrowUpRight, BarChart3 } from 'lucide-react'

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-gray-200 bg-white px-8 py-14 text-center dark:border-white/[0.08] dark:bg-[#1C1C1C]">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.07] dark:bg-white/[0.04]">
          <BarChart3 size={28} className="text-gray-300 dark:text-gray-500" aria-hidden />
        </div>
        <div className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border border-green-300/60 bg-green-400/40 dark:border-green-500/40 dark:bg-green-500/30" />
        <div className="absolute -bottom-1 -left-1.5 h-3 w-3 rounded-full border border-blue-300/60 bg-blue-400/40 dark:border-blue-500/40 dark:bg-blue-500/30" />
      </div>

      <div className="max-w-sm space-y-2">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
          Seu painel financeiro ainda está esperando os primeiros sinais.
        </p>
        <p className="text-sm leading-relaxed text-gray-400 dark:text-gray-500">
          Registre receitas e despesas para destravar saldo, tendência, taxa de poupança e a leitura
          completa do mês.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard/lancamentos"
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 active:bg-green-800"
        >
          <ArrowDownLeft size={15} aria-hidden />
          Registrar receita
        </Link>
        <Link
          href="/dashboard/lancamentos"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.10] dark:text-gray-200 dark:hover:bg-white/[0.05]"
        >
          <ArrowUpRight size={15} aria-hidden />
          Registrar despesa
        </Link>
      </div>
    </div>
  )
}
