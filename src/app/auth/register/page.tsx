'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccess(false)

    if (!email || !password || !passwordConfirm) {
      setFormError('Preencha todos os campos')
      return
    }

    if (password !== passwordConfirm) {
      setFormError('As senhas não correspondem')
      return
    }

    if (password.length < 6) {
      setFormError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      await signUp(email, password)
      setSuccess(true)
      setEmail('')
      setPassword('')
      setPasswordConfirm('')
      
      // Redirecionar após 2 segundos
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err) {
      setFormError(error || 'Erro ao criar conta')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-900">
          Meu Canga
        </h1>

        <h2 className="text-xl font-semibold text-center text-slate-800 mb-6">
          Criar Conta
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {/* Sucesso */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                Conta criada! Redirecionando para login...
              </p>
            </div>
          )}

          {/* Erros */}
          {(formError || error) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {formError || error}
              </p>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        {/* Link para Login */}
        <p className="text-center text-slate-600 mt-6">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}