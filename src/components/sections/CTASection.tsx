'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const benefits = [
  'Sem cartão de crédito para começar',
  'Cancele quando quiser',
  'Suporte exclusivo para militares e civis',
  'Dados criptografados e seguros',
]

export function CTASection() {
  return (
    <section
      className="relative py-24 bg-precision-black overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-blue/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-blue mb-3">
          Comece hoje
        </p>
        <h2
          id="cta-heading"
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5"
        >
          Sua farda já está paga.{' '}
          <span className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">
            Seu futuro também pode estar.
          </span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Junte-se a mais de 3.200 policiais que já tomaram controle das suas finanças.
          É grátis para começar.
        </p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-1.5 text-sm text-gray-400">
              <CheckCircle2 size={14} className="text-accent-green shrink-0" aria-hidden />
              {b}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className={cn(
              'inline-flex items-center justify-center gap-2 h-13 px-7 text-base font-medium rounded-lg',
              'bg-accent-blue text-white hover:bg-blue-600 active:bg-blue-700',
              'shadow-sm hover:shadow-md transition-all duration-200'
            )}
          >
            Criar conta gratuita
            <ArrowRight size={18} aria-hidden />
          </Link>
          <Link
            href="/auth/login"
            className={cn(
              'inline-flex items-center justify-center h-13 px-7 text-base font-medium rounded-lg',
              'border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white',
              'transition-all duration-200'
            )}
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </section>
  )
}
