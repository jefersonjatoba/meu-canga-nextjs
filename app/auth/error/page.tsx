'use client'

import { Button } from '@/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Erro desconhecido'

  const errorMessages: Record<string, string> = {
    Configuration: 'Erro de configuração do servidor.',
    AccessDenied: 'Acesso negado.',
    Verification: 'Token de verificação inválido ou expirado.',
  }

  const displayMessage = errorMessages[error] ?? error

  return (
    <div className="bg-error/10 border border-error text-error p-4 rounded-lg text-center mb-6">
      <p className="text-sm">{displayMessage}</p>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error to-precision-black p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl text-error">Erro de Autenticação</CardTitle>
          </CardHeader>

          <CardContent>
            <Suspense fallback={
              <div className="bg-error/10 border border-error text-error p-4 rounded-lg text-center mb-6">
                <p className="text-sm">Carregando detalhes do erro...</p>
              </div>
            }>
              <ErrorContent />
            </Suspense>

            <Link href="/auth/login" className="block">
              <Button className="w-full" size="md">
                Voltar para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
