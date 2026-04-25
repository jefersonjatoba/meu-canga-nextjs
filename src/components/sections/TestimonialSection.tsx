'use client'

import * as React from 'react'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sgt. Marcos Oliveira',
    role: 'Policial Militar — PMESP, 14 anos de carreira',
    avatar: 'MO',
    avatarBg: 'bg-accent-blue',
    quote:
      'Antes do MeuCanga eu não tinha a menor ideia de quanto ganhava por mês, entre salário, RAS e extras. Agora controlo tudo em um lugar e ainda invisto R$800 todo mês automaticamente.',
    stars: 5,
  },
  {
    name: 'Delegada Fernanda Costa',
    role: 'Polícia Civil do RJ — Delegacia de Homicídios',
    avatar: 'FC',
    avatarBg: 'bg-accent-green',
    quote:
      'A feature de escala me ajuda a planejar minha vida pessoal. O controle de investimentos me deu clareza para finalmente começar a me preocupar com a aposentadoria. Recomendo para todo colega.',
    stars: 5,
  },
  {
    name: 'CB João Ferreira',
    role: 'Bombeiro Militar — CBMGO',
    avatar: 'JF',
    avatarBg: 'bg-accent-orange',
    quote:
      'Não imaginava que um app entendesse tão bem a realidade de quem trabalha em plantão. As RAS, os extras de feriado — tudo categorizando certinho. Economizei R$14k no primeiro ano.',
    stars: 5,
  },
]

export function TestimonialSection() {
  return (
    <section
      className="py-24 bg-gray-50 dark:bg-[#0A0A0A]"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent-blue mb-3">
            Depoimentos
          </p>
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-5"
          >
            Quem usa, não abre mão
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Profissionais de segurança pública em todo o Brasil transformando sua relação com o dinheiro.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="relative rounded-2xl p-6 bg-white dark:bg-[#161616] border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <Quote
                size={32}
                className="absolute top-5 right-5 text-gray-200 dark:text-gray-800"
                aria-hidden
              />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4" aria-label={`${t.stars} estrelas`}>
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <figcaption className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center shrink-0`}
                  aria-hidden
                >
                  <span className="text-white text-xs font-bold">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
