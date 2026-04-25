import type { Metadata } from 'next'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { TestimonialSection } from '@/components/sections/TestimonialSection'
import { CTASection } from '@/components/sections/CTASection'
import { FooterSection } from '@/components/sections/FooterSection'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'MeuCanga — Finanças para Segurança Pública',
  description:
    'Controle de escala, RAS, lançamentos financeiros, investimentos e metas para profissionais de segurança pública.',
}

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-6 lg:px-8"
        style={{ background: 'linear-gradient(to bottom, rgba(15,15,15,0.95) 0%, transparent 100%)' }}
        aria-label="Navegação principal"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
          aria-label="MeuCanga — página inicial"
        >
          <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
            <Shield size={16} className="text-white" aria-hidden />
          </div>
          <span className="text-base font-bold text-white group-hover:text-gray-200 transition-colors">
            MeuCanga
          </span>
        </Link>

        {/* Right nav */}
        <div className="flex items-center gap-4">
          <ThemeToggle size="sm" />
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-medium bg-accent-blue text-white hover:bg-blue-600 transition-colors px-4 py-2 rounded-lg"
          >
            Criar conta
          </Link>
        </div>
      </nav>

      <main>
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
        <TestimonialSection />
        <CTASection />
      </main>

      <FooterSection />
    </>
  )
}

// ─── Benefits section (inline — simple enough to not need its own file) ───────

function BenefitsSection() {
  const benefits = [
    {
      number: '01',
      title: 'Visibilidade total',
      description:
        'Veja todas as suas fontes de renda — salário, RAS, extras, décimo terceiro — em um único painel. Nada mais escapa.',
      color: 'text-accent-blue',
      border: 'border-accent-blue/20',
    },
    {
      number: '02',
      title: 'Planejamento real',
      description:
        'Monte sua reserva de emergência, planeje a aposentadoria e atinja metas com dados reais do seu histórico financeiro.',
      color: 'text-accent-green',
      border: 'border-accent-green/20',
    },
    {
      number: '03',
      title: 'Sem burocracia',
      description:
        'Interface simples, rápida e intuitiva. Registre um lançamento em menos de 10 segundos — feito para quem tem pouco tempo.',
      color: 'text-accent-orange',
      border: 'border-accent-orange/20',
    },
    {
      number: '04',
      title: 'Segurança de dados',
      description:
        'Dados criptografados end-to-end. Servidores no Brasil. Conformidade com a LGPD. Sua vida financeira é sua, ponto.',
      color: 'text-purple-400',
      border: 'border-purple-400/20',
    },
  ]

  return (
    <section
      className="py-24 bg-gray-50 dark:bg-[#0D0D0D]"
      aria-labelledby="benefits-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left header */}
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-blue mb-3">
              Por que MeuCanga
            </p>
            <h2
              id="benefits-heading"
              className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-5"
            >
              Criado com policiais,{' '}
              <span className="text-accent-blue">para policiais</span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Entendemos os plantões noturnos, as RAS de última hora e as complexidades
              salariais da categoria. Aqui, tudo faz sentido para a sua realidade.
            </p>
          </div>

          {/* Right benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div
                key={b.number}
                className={`rounded-2xl p-5 border ${b.border} bg-white dark:bg-[#161616]`}
              >
                <span className={`text-3xl font-black ${b.color} block mb-3 leading-none`}>
                  {b.number}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                  {b.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
