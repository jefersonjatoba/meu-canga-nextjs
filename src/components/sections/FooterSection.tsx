'use client'

import * as React from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'

const footerLinks = {
  Produto: [
    { label: 'Funcionalidades', href: '/#features' },
    { label: 'Preços', href: '/pricing' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Recursos: [
    { label: 'Documentação', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Suporte', href: '/suporte' },
  ],
  Empresa: [
    { label: 'Sobre', href: '/sobre' },
    { label: 'Carreiras', href: '/carreiras' },
    { label: 'Contato', href: '/contato' },
  ],
  Legal: [
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'Termos de Uso', href: '/termos' },
    { label: 'Cookies', href: '/cookies' },
  ],
}

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', symbol: 'IG' },
  { label: 'Twitter/X', href: 'https://x.com', symbol: 'X' },
  { label: 'LinkedIn', href: 'https://linkedin.com', symbol: 'in' },
  { label: 'YouTube', href: 'https://youtube.com', symbol: 'YT' },
]

export function FooterSection() {
  return (
    <footer
      className="bg-precision-black border-t border-gray-800"
      aria-label="Rodapé"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center">
                <Shield size={16} className="text-white" aria-hidden />
              </div>
              <span className="text-lg font-bold text-white">MeuCanga</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">
              Finanças inteligentes para quem protege o Brasil. Controle, planejamento
              e crescimento patrimonial para profissionais de segurança pública.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-400 hover:text-white text-xs font-bold"
                >
                  {s.symbol}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                {group}
              </p>
              <ul className="space-y-2.5" role="list">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} MeuCanga Tecnologia Ltda. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-600">
            Feito com cuidado para quem serve ao Brasil.{' '}
            <span className="text-accent-green">&#10084;</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
