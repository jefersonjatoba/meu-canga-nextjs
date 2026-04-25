'use client'

import { Button } from '@/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Erro desconhecido'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error to-precision-black p-4">
      <div className="w-full max-w-md animate-slideUp">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl text-error">Erro!</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="bg-error/10 border border-error text-error p-4 rounded-lg text-center mb-6">
              <p className="text-sm">{error}</p>
            </div>

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
