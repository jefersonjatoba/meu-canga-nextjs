'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Shield, TrendingUp, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-precision-black"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-green/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[96px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          {/* Trust badge */}
          <div className="mb-6 animate-[fadeIn_600ms_ease-out_forwards]">
            <Badge variant="outline" className="border-accent-blue/40 text-accent-blue bg-accent-blue/10 px-3 py-1.5 text-sm">
              <Shield size={13} className="mr-1" aria-hidden />
              Feito para Segurança Pública
            </Badge>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-white mb-6 animate-[slideUp_600ms_ease-out_200ms_forwards] opacity-0"
          >
            Controle total{' '}
            <span className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">
              das suas finanças
            </span>{' '}
            como policial
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl animate-[slideUp_600ms_ease-out_350ms_forwards] opacity-0">
            Escala, RAS, lançamentos e investimentos em uma plataforma exclusiva para
            profissionais da segurança pública. Saiba exatamente onde vai cada centavo
            do seu suor.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 animate-[slideUp_600ms_ease-out_450ms_forwards] opacity-0">
            <Link
              href="/auth/register"
              className={cn(
                'inline-flex items-center gap-2 h-11 px-5 text-base font-medium rounded-lg',
                'bg-accent-blue text-white hover:bg-blue-600 active:bg-blue-700',
                'shadow-sm hover:shadow-md transition-all duration-200'
              )}
            >
              Começar gratuitamente
              <ArrowRight size={18} aria-hidden />
            </Link>

            <Link
              href="/auth/login"
              className={cn(
                'inline-flex items-center h-11 px-5 text-base font-medium rounded-lg',
                'border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white',
                'transition-all duration-200'
              )}
            >
              Entrar na plataforma
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center gap-6 animate-[fadeIn_600ms_ease-out_600ms_forwards] opacity-0">
            <div className="flex -space-x-2">
              {['PM', 'BM', 'PC', 'GCM', 'PF'].map((label) => (
                <div
                  key={label}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-precision-black flex items-center justify-center"
                  aria-hidden
                >
                  <span className="text-[9px] font-bold text-gray-300">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              <span className="text-white font-semibold">+3.200</span> policiais já controlam suas finanças
            </p>
          </div>
        </div>

        {/* Floating stats */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 animate-[slideUp_600ms_ease-out_500ms_forwards] opacity-0">
          {[
            { icon: Wallet, label: 'Lançamentos/mês', value: '24k+', color: 'text-accent-blue' },
            { icon: TrendingUp, label: 'Economizado', value: 'R$ 2.8M', color: 'text-accent-green' },
            { icon: Shield, label: 'RAS registradas', value: '18k+', color: 'text-purple-400' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-44"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={stat.color} aria-hidden />
                  <span className="text-xs text-gray-400">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
