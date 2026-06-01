'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Shield, ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/redefinir-senha`,
    })

    setIsLoading(false)

    if (error) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent-blue flex items-center justify-center shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">MeuCanga</span>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <Mail size={26} className="text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Email enviado!</h1>
              <p className="text-sm text-gray-400">
                Enviamos um link de redefinição para <span className="text-white font-medium">{email}</span>.
                Verifique sua caixa de entrada e o spam.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-accent-blue hover:underline mt-2"
              >
                <ArrowLeft size={13} />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Redefinir senha</h1>
              <p className="text-sm text-gray-500 mb-6">
                Informe seu email e enviaremos um link para criar uma nova senha.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-600 bg-white/[0.06] border border-white/[0.08] hover:border-white/20 focus:border-accent-blue focus:bg-white/[0.08] transition-colors outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Enviar link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-5">
                Lembrou a senha?{' '}
                <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          © 2026 MeuCanga. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
