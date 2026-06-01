'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/hq-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push(data.redirectTo)
      } else {
        setAttempts((n) => n + 1)
        setError(data.error ?? 'Credenciais inválidas')
        setLoading(false)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
          {attempts >= 3 && (
            <p className="text-xs text-red-500/70 mt-1">
              Atenção: {5 - attempts} tentativas restantes antes do bloqueio.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Usuário</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          autoFocus
          className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          placeholder="admin"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full bg-white/[0.04] border border-white/[0.12] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Verificando…
          </span>
        ) : (
          'Acessar painel'
        )}
      </button>
    </form>
  )
}
