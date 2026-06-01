'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Clock3, Sparkles, X, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeBannerProps {
  userName: string | null | undefined
  createdAt: string
  plan: string
}

const DISMISS_KEY = 'mc_welcome_dismissed'
const OFFER_HOURS = 48

export function WelcomeBanner({ userName, createdAt, plan }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(false)
  const [horasRestantes, setHorasRestantes] = useState(0)

  useEffect(() => {
    if (plan !== 'free') return
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY)) return

    const criadoEm = new Date(createdAt).getTime()
    const agora = Date.now()
    const horas = (agora - criadoEm) / (1000 * 60 * 60)

    if (horas > OFFER_HOURS) return

    const timer = window.setTimeout(() => {
      setHorasRestantes(Math.ceil(OFFER_HOURS - horas))
      setVisible(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [createdAt, plan])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const nome = userName?.split(' ')[0] ?? 'Policial'

  return (
    <div
      role="alert"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,251,235,1)_0%,rgba(255,247,237,1)_55%,rgba(255,255,255,1)_100%)] shadow-sm dark:border-amber-500/20 dark:bg-[linear-gradient(135deg,rgba(42,28,12,0.95)_0%,rgba(28,22,16,0.96)_55%,rgba(16,16,16,1)_100%)]',
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_30%)] pointer-events-none" aria-hidden />

      <div className="relative flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-700 shadow-sm dark:bg-amber-500/10 dark:text-amber-300">
          <Sparkles size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {nome}, explore o modo Pro do seu cockpit financeiro.
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-amber-700 shadow-sm dark:bg-black/20 dark:text-amber-300">
              <Clock3 size={11} />
              {horasRestantes}h
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            Ative visão avançada, automações e leitura mais estratégica do seu dinheiro com 30% no primeiro mês.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <Link
            href="/dashboard/upgrade?origem=welcome-banner"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            <Zap size={14} />
            Conhecer plano Pro
          </Link>
          <button
            onClick={dismiss}
            aria-label="Dispensar oferta"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/70 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
