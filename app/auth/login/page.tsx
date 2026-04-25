'use client'

import { Button } from '@/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { Input } from '@/components/Input'
import { formatCPF, validateCPF } from '@/lib/utils'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const cpfValue = watch('cpf')

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setValue('cpf', formatted)
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await signIn('credentials', {
        cpf: data.cpf.replace(/\D/g, ''),
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setErrorMessage(result.error)
      } else if (result?.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      setErrorMessage('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-blue to-precision-black p-4">
      <div className="w-full max-w-md animate-slideUp">
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
                label="CPF"
                placeholder="000.000.000-00"
                {...register('cpf')}
                onChange={handleCPFChange}
                error={errors.cpf?.message}
                autoComplete="off"
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
                isLoading={isLoading}
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
