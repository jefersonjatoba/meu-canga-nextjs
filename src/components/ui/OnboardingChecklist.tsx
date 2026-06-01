'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OnboardingStep {
  id: string
  label: string
  descricao: string
  href: string
  concluido: boolean
  pontos: number
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[]
  isPro: boolean
}

const DISMISS_KEY = 'mc_onboarding_dismissed'

export function OnboardingChecklist({ steps, isPro }: OnboardingChecklistProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && !!localStorage.getItem(DISMISS_KEY),
  )

  const concluidos = steps.filter((step) => step.concluido).length
  const total = steps.length
  const pct = Math.round((concluidos / total) * 100)
  const completo = concluidos === total

  if (dismissed || completo) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#1a1a1a]">
      <button
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      >
        <div className="relative h-11 w-11 shrink-0">
          <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="currentColor"
              className="text-gray-100 dark:text-white/[0.06]"
              strokeWidth="4"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={pct === 100 ? '#10b981' : '#2563EB'}
              strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 113} 113`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
            {pct}%
          </span>
        </div>

        <div className="flex-1 text-left">
          <p className="mb-1 text-sm font-bold leading-none text-gray-900 dark:text-white">Configure sua base</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {concluidos}/{total} etapas concluídas
          </p>
        </div>

        {collapsed ? (
          <ChevronDown size={16} className="shrink-0 text-gray-400" />
        ) : (
          <ChevronUp size={16} className="shrink-0 text-gray-400" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-2 px-5 pb-5">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.concluido ? '#' : step.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 transition-all',
                step.concluido
                  ? 'cursor-default opacity-60'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04]',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all',
                  step.concluido ? 'bg-emerald-500' : 'border-2 border-gray-200 dark:border-white/20',
                )}
              >
                {step.concluido && <Check size={13} className="text-white" />}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'mb-0.5 text-sm font-medium leading-none',
                    step.concluido ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white',
                  )}
                >
                  {step.label}
                </p>
                {!step.concluido && <p className="text-xs text-gray-500 dark:text-gray-400">{step.descricao}</p>}
              </div>

              {!step.concluido && (
                <span className="shrink-0 rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-bold text-accent-blue">
                  +{step.pontos}pts
                </span>
              )}
            </Link>
          ))}

          <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-white/[0.06]">
            {!isPro && (
              <Link
                href="/dashboard/upgrade"
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
              >
                <Zap size={11} />
                Desbloqueie tudo com o Pro
              </Link>
            )}
            <button
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, '1')
                setDismissed(true)
              }}
              className="ml-auto text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              Dispensar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
