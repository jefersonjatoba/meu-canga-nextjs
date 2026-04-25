'use client'

import { Button } from '@/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { Input } from '@/components/Input'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isAuthenticated, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await signIn(data.email, data.password)
      router.replace('/dashboard')
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Email ou senha incorretos.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-blue to-precision-black">
        <div className="w-10 h-10 rounded-full border-4 border-white border-r-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-blue to-precision-black p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Meu Canga</CardTitle>
            <p className="text-center text-gray-500 text-sm mt-2">
              Fintech para Segurança Pública
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMessage && (
                <div className="bg-error/10 border border-error text-error p-3 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
              />

              <Input
                label="Senha"
                type="password"
                placeholder="Sua senha segura"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full"
                size="md"
              >
                Entrar
              </Button>
            </form>

            <div className="mt-6 border-t pt-4">
              <p className="text-center text-sm text-gray-600">
                Não tem conta?{' '}
                <Link
                  href="/auth/register"
                  className="text-accent-blue font-semibold hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/70 text-xs mt-8">
          © 2026 Meu Canga. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
