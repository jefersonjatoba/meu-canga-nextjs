'use client'

import * as React from 'react'
import {
  CalendarDays,
  Shield,
  Wallet,
  TrendingUp,
  Target,
  BarChart3,
} from 'lucide-react'

const features = [
  {
    icon: CalendarDays,
    color: 'text-accent-blue',
    bg: 'bg-blue-500/10',
    title: 'Controle de Escala',
    description:
      'Registre todos os seus turnos, folgas e extras. Acompanhe seu histórico completo e calcule sua carga horária mensal automaticamente.',
  },
  {
    icon: Shield,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    title: 'RAS — Regime de Adicional',
    description:
      'Agende e acompanhe suas RAS com status em tempo real. Nunca perca uma data de pagamento ou deixe de registrar uma jornada extra.',
  },
  {
    icon: Wallet,
    color: 'text-accent-green',
    bg: 'bg-green-500/10',
    title: 'Lançamentos Financeiros',
    description:
      'Categorize receitas e despesas com precisão. Recorrências automáticas, importação de extratos e relatórios detalhados.',
  },
  {
    icon: TrendingUp,
    color: 'text-accent-orange',
    bg: 'bg-amber-500/10',
    title: 'Investimentos',
    description:
      'Monitore toda sua carteira: renda fixa, ações, FIIs e previdência. Veja a evolução do seu patrimônio em tempo real.',
  },
  {
    icon: Target,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    title: 'Metas Financeiras',
    description:
      'Defina objetivos e acompanhe o progresso. Reserve de emergência, compra do imóvel ou aposentadoria — seu ritmo, sua meta.',
  },
  {
    icon: BarChart3,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    title: 'Relatórios Inteligentes',
    description:
      'Dashboards visuais com gráficos de fluxo de caixa, análise de gastos por categoria e score de saúde financeira.',
  },
]

export function FeaturesSection() {
  return (
    <section
      className="py-24 bg-white dark:bg-[#0D0D0D]"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-blue mb-3">
            Funcionalidades
          </p>
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-5"
          >
            Tudo que um policial precisa
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Desenvolvido com profissionais de segurança pública para resolver os desafios
            financeiros únicos da profissão.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-2xl p-6 border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#161616] hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg dark:hover:shadow-black/40 transition-all duration-300"
              >
                <div
                  className={`inline-flex w-11 h-11 items-center justify-center rounded-xl mb-4 ${feature.bg}`}
                  aria-hidden
                >
                  <Icon size={22} className={feature.color} />
                </div>

                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
