'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase injeta a sessão temporária via fragment (#access_token=...) na URL
  // O listener onAuthStateChange captura o evento PASSWORD_RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (error) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.')
      return
    }

    setDone(true)
    setTimeout(() => router.replace('/auth/login'), 3000)
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
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle size={26} className="text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Senha redefinida!</h1>
              <p className="text-sm text-gray-400">
                Sua senha foi alterada com sucesso. Redirecionando para o login…
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Nova senha</h1>
              <p className="text-sm text-gray-500 mb-6">
                Crie uma senha segura para sua conta.
              </p>

              {!sessionReady && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-xl text-sm mb-4">
                  Aguardando validação do link… Se demorar, volte ao email e clique novamente.
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-600 bg-white/[0.06] border border-white/[0.08] hover:border-white/20 focus:border-accent-blue focus:bg-white/[0.08] transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder:text-gray-600 bg-white/[0.06] border border-white/[0.08] hover:border-white/20 focus:border-accent-blue focus:bg-white/[0.08] transition-colors outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !sessionReady}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-blue text-white font-semibold text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Salvar nova senha'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-5">
                <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                  Voltar para o login
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
