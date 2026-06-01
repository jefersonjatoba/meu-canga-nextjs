import Link from 'next/link'
import { ArrowRight, CreditCard, RefreshCw } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { cn } from '@/lib/utils'

interface FixedCommitmentsCardProps {
  recorrenciasPrevistasMesCentavos: number
  assinaturasPrevistasMesCentavos: number
  totalReceitasCentavos: number
}

type HealthTone = 'healthy' | 'warning' | 'critical' | 'neutral'

function getHealthTone(pct: number | null): HealthTone {
  if (pct === null) return 'neutral'
  if (pct <= 40) return 'healthy'
  if (pct <= 65) return 'warning'
  return 'critical'
}

const toneStyles: Record<HealthTone, { bar: string; text: string; bg: string }> = {
  healthy: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  warning: {
    bar: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
  critical: {
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
  neutral: {
    bar: 'bg-gray-400',
    text: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-white/[0.04]',
  },
}

function healthLabel(tone: HealthTone, pct: number | null): string {
  if (pct === null) return 'Configure receitas para ver o peso percentual'
  if (tone === 'healthy') return `${pct}% da receita comprometida — saudável`
  if (tone === 'warning') return `${pct}% da receita comprometida — atenção`
  return `${pct}% da receita comprometida — custo fixo elevado`
}

export function FixedCommitmentsCard({
  recorrenciasPrevistasMesCentavos,
  assinaturasPrevistasMesCentavos,
  totalReceitasCentavos,
}: FixedCommitmentsCardProps) {
  const total = recorrenciasPrevistasMesCentavos + assinaturasPrevistasMesCentavos
  if (total === 0) return null

  const pct = totalReceitasCentavos > 0 ? Math.round((total / totalReceitasCentavos) * 100) : null
  const tone = getHealthTone(pct)
  const styles = toneStyles[tone]
  const barPct = pct !== null ? Math.min(pct, 100) : 0

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1C]">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Compromissos fixos previstos
            </h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Previsto para este mês — sem misturar com gastos variáveis
            </p>
          </div>
          <span className="mt-0.5 shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
            Previsto
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
            <RefreshCw size={14} className="text-indigo-600 dark:text-indigo-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Despesas fixas em conta</p>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              Recorrências configuradas para débito em conta
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
              {formatBRL(recorrenciasPrevistasMesCentavos)}
            </span>
            <Link
              href="/dashboard/recorrencias"
              className="rounded p-1 text-gray-300 transition-colors hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400"
              title="Ver recorrências"
            >
              <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/10">
            <CreditCard size={14} className="text-violet-600 dark:text-violet-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Assinaturas no cartão</p>
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              Cobranças recorrentes esperadas na próxima fatura
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
              {formatBRL(assinaturasPrevistasMesCentavos)}
            </span>
            <Link
              href="/dashboard/cartoes/assinaturas"
              className="rounded p-1 text-gray-300 transition-colors hover:text-violet-500 dark:text-gray-600 dark:hover:text-violet-400"
              title="Ver assinaturas"
            >
              <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className={cn('border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]', styles.bg)}>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total fixo previsto</p>
          <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatBRL(total)}</p>
        </div>

        {pct !== null ? (
          <>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.08]">
              <div
                className={cn('h-full rounded-full transition-all duration-500', styles.bar)}
                style={{ width: `${barPct}%` }}
                aria-hidden
              />
            </div>
            <p className={cn('text-[11px] font-medium', styles.text)}>{healthLabel(tone, pct)}</p>
          </>
        ) : (
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Registre receitas para medir o peso percentual dos custos fixos.
          </p>
        )}
      </div>
    </div>
  )
}
