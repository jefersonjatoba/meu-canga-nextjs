import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="pt-BR">
      <body className="bg-white text-black">
        {children}
      </body>
    </html>
  )
}
