'use client'

import { useState } from 'react'
import { Check, Zap, Sparkles, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import { FEATURES_PRO, PRECO_MENSAL_CENTS, PRECO_ANUAL_CENTS } from '@/lib/plans'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/utils'

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const FREE_LIMITES = [
  { texto: '10 lançamentos por mês' },
  { texto: '4 RAS por mês' },
  { texto: '1 meta ativa' },
  { texto: '2 recorrências' },
  { texto: '3 contas bancárias' },
  { texto: '1 PDF por mês' },
]

export default function UpgradePage() {
  const { isPro, loading } = usePlan()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  const precoMes = billing === 'annual'
    ? PRECO_ANUAL_CENTS / 12
    : PRECO_MENSAL_CENTS
  const precoTotal = billing === 'annual' ? PRECO_ANUAL_CENTS : PRECO_MENSAL_CENTS
  const desconto = Math.round((1 - PRECO_ANUAL_CENTS / (PRECO_MENSAL_CENTS * 12)) * 100)

  if (!loading && isPro) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Sparkles size={28} className="text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Você já é PRO!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Aproveite todos os recursos ilimitados do MeuCanga PRO.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar
      </Link>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4">
          <Zap size={14} />
          Desbloqueie tudo
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          MeuCanga <span className="text-amber-500">PRO</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Feito para policiais militares que levam as finanças a sério.
          Sem limites, sem restrições.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-white/[0.06] p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              billing === 'monthly'
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2',
              billing === 'annual'
                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            )}
          >
            Anual
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
              -{desconto}%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-6 mb-10">
        {/* Free card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Grátis</p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">R$ 0</span>
              <span className="text-gray-400 text-sm mb-1">/mês</span>
            </div>
          </div>

          <ul className="space-y-2.5 mb-6">
            {FREE_LIMITES.map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                <Check size={14} className="text-gray-400 shrink-0" />
                {f.texto}
              </li>
            ))}
          </ul>

          <div className="rounded-xl py-2.5 text-center text-sm font-medium text-gray-400 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]">
            Plano atual
          </div>
        </div>

        {/* PRO card */}
        <div className="rounded-2xl border-2 border-amber-400 dark:border-amber-500 bg-white dark:bg-[#1a1a1a] p-6 relative overflow-hidden shadow-lg shadow-amber-500/10">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />

          <div className="relative mb-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">PRO</p>
              {billing === 'annual' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                  2 meses grátis
                </span>
              )}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{fmtBRL(precoMes)}</span>
              <span className="text-gray-400 text-sm mb-1">/mês</span>
            </div>
            {billing === 'annual' && (
              <p className="text-xs text-gray-400 mt-0.5">Cobrado {fmtBRL(precoTotal)}/ano</p>
            )}
          </div>

          <ul className="relative space-y-2.5 mb-6">
            {FEATURES_PRO.slice(0, 8).map((f, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <Check size={14} className="text-amber-500 shrink-0" />
                {f.texto}
              </li>
            ))}
            <li className="text-xs text-gray-400 pl-6">+{FEATURES_PRO.length - 8} recursos incluídos</li>
          </ul>

          <a
            href="mailto:suporte@meu-canga.com?subject=Quero%20assinar%20o%20PRO"
            className="relative w-full flex items-center justify-center gap-2 rounded-xl py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all duration-150 shadow-md shadow-amber-500/25"
          >
            <Zap size={15} />
            Assinar PRO — Entrar em contato
          </a>
        </div>
      </div>

      {/* Full features list */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          Tudo incluído no PRO
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {FEATURES_PRO.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-base leading-none">{f.emoji}</span>
              <span>{f.texto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Garantia */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Shield size={13} className="text-emerald-500" />
          Processo manual — ativação em até 24h
        </span>
        <span className="flex items-center gap-1.5">
          <Check size={13} className="text-emerald-500" />
          Cancele quando quiser
        </span>
      </div>
    </div>
  )
}
