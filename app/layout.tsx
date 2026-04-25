import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Meu Canga - SaaS Fintech para Segurança Pública',
  description: 'Gerenciamento financeiro para profissionais de segurança pública',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-white dark:bg-precision-black text-precision-black dark:text-light-gray">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
