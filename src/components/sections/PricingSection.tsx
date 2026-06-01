'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, Sparkles, Shield, ArrowRight } from 'lucide-react'
import { FEATURES_PRO, PRECO_MENSAL_CENTS, PRECO_ANUAL_CENTS } from '@/lib/plans'
import { cn } from '@/lib/utils'

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const FREE_ITEMS = [
  { texto: '10 lançamentos por mês', ok: true },
  { texto: '4 RAS por mês', ok: true },
  { texto: '1 meta ativa', ok: true },
  { texto: '2 recorrências', ok: true },
  { texto: '3 contas bancárias', ok: true },
  { texto: 'Investimentos', ok: false },
  { texto: 'Agente IA financeiro', ok: false },
  { texto: 'Base Jurídica', ok: false },
  { texto: 'Exportação CSV', ok: false },
]

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  const precoMes = billing === 'annual'
    ? Math.round(PRECO_ANUAL_CENTS / 12)
    : PRECO_MENSAL_CENTS
  const precoTotal = billing === 'annual' ? PRECO_ANUAL_CENTS : PRECO_MENSAL_CENTS
  const desconto = Math.round((1 - PRECO_ANUAL_CENTS / (PRECO_MENSAL_CENTS * 12)) * 100)
  const economia = (PRECO_MENSAL_CENTS * 12) - PRECO_ANUAL_CENTS

  return (
    <section
      id="precos"
      className="py-24 bg-precision-black relative overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/8 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-4">
            <Zap size={13} />
            Planos simples, sem pegadinha
          </div>
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4"
          >
            Comece grátis.{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Evolua quando quiser.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Sem cartão de crédito para começar. Cancele quando quiser, sem multa.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-xl bg-white/[0.06] p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn(
                'px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                billing === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn(
                'px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2',
                billing === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              Anual
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                -{desconto}%
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-14">
          {/* Free */}
          <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Gratuito</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">R$&nbsp;0</span>
                <span className="text-gray-500 mb-1.5">/mês</span>
              </div>
              <p className="text-sm text-gray-500">Para sempre, sem limite de tempo</p>
            </div>

            <Link
              href="/auth/register"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.12] text-gray-300 text-sm font-semibold hover:bg-white/[0.06] transition-colors mb-7"
            >
              Começar grátis
            </Link>

            <ul className="space-y-3">
              {FREE_ITEMS.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {f.ok
                    ? <Check size={15} className="text-emerald-400 shrink-0" />
                    : <X size={15} className="text-gray-600 shrink-0" />
                  }
                  <span className={f.ok ? 'text-gray-300' : 'text-gray-600'}>{f.texto}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/10 to-transparent p-8 relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-xl rounded-tr-xl">
                Mais popular
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">PRO</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">{fmtBRL(precoMes)}</span>
                <span className="text-gray-400 mb-1.5">/mês</span>
              </div>
              {billing === 'annual' ? (
                <p className="text-sm text-gray-400">
                  Cobrado {fmtBRL(precoTotal)}/ano ·{' '}
                  <span className="text-emerald-400 font-semibold">economize {fmtBRL(economia)}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-400">Cobrado mensalmente · sem fidelidade</p>
              )}
            </div>

            <Link
              href={`/auth/register?plano=pro&billing=${billing}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition-all duration-150 shadow-lg shadow-amber-500/25 mb-7"
            >
              <Zap size={15} />
              Assinar PRO agora
              <ArrowRight size={15} />
            </Link>

            <ul className="space-y-3">
              {FEATURES_PRO.slice(0, 9).map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check size={15} className="text-amber-400 shrink-0" />
                  <span className="text-gray-200">{f.texto}</span>
                </li>
              ))}
              <li className="text-xs text-gray-500 pl-6">
                + {FEATURES_PRO.length - 9} recursos adicionais
              </li>
            </ul>
          </div>
        </div>

        {/* Garantias */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            7 dias de garantia — devolução total
          </span>
          <span className="flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            Cancele quando quiser, sem multa
          </span>
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            Ativação imediata após pagamento
          </span>
          <span className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            Menos de {fmtBRL(Math.round(PRECO_MENSAL_CENTS / 30))}/dia
          </span>
        </div>
      </div>
    </section>
  )
}
