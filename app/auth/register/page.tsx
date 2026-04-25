'use client'

import { Button } from '@/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { Input } from '@/components/Input'
import { formatCPF, validateCPF } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const cpfValue = watch('cpf')

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setValue('cpf', formatted)
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      // TODO: Implementar criação de usuário
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // })

      // Por enquanto, apenas redireciona para login
      setTimeout(() => {
        router.push('/auth/login')
      }, 1000)
    } catch (error) {
      setErrorMessage('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-green to-precision-black p-4">
      <div className="w-full max-w-md animate-slideUp">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Criar Conta</CardTitle>
            <p className="text-center text-gray-500 text-sm mt-2">
              Meu Canga - Fintech para Segurança Pública
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
                label="Nome Completo"
                placeholder="Seu nome"
                {...register('name')}
                error={errors.name?.message}
              />

              <Input
                label="CPF"
                placeholder="000.000.000-00"
                {...register('cpf')}
                onChange={handleCPFChange}
                error={errors.cpf?.message}
                autoComplete="off"
              />

              <Input
                label="Email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Input
                label="Telefone (opcional)"
                type="tel"
                placeholder="(11) 99999-9999"
                {...register('phone')}
              />

              <Input
                label="Senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...register('password')}
                error={errors.password?.message}
              />

              <Input
                label="Confirmar Senha"
                type="password"
                placeholder="Confirme sua senha"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
              />

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="md"
              >
                Criar Conta
              </Button>
            </form>

            <div className="mt-6 border-t pt-4">
              <p className="text-center text-sm text-gray-600">
                Já tem conta?{' '}
                <Link
                  href="/auth/login"
                  className="text-accent-green font-semibold hover:underline"
                >
                  Fazer login
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
