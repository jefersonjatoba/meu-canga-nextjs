import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'MeuCanga — Finanças para Segurança Pública',
    template: '%s | MeuCanga',
  },
  description:
    'Controle de escala, RAS, lançamentos financeiros, investimentos e metas para profissionais de segurança pública.',
  keywords: ['fintech', 'segurança pública', 'policial', 'finanças', 'controle financeiro'],
  authors: [{ name: 'MeuCanga' }],
  creator: 'MeuCanga',
  metadataBase: new URL('https://meucanga.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'MeuCanga',
    title: 'MeuCanga — Finanças para Segurança Pública',
    description: 'Controle total das suas finanças como policial.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0F0F0F' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/*
        suppressHydrationWarning is required because the ThemeToggle hook
        adds/removes the `dark` class on <html> client-side, causing a
        harmless mismatch that React would otherwise warn about.
      */}
      <body className="bg-white text-gray-900 dark:bg-precision-black dark:text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
