'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  userId: string
  currentPlan: string
  currentRole: string
}

type ActionState = 'idle' | 'loading' | 'success' | 'error'

export function AdminUserActions({ userId, currentPlan, currentRole }: Props) {
  const [state, setState] = useState<ActionState>('idle')
  const [message, setMessage] = useState('')

  async function callApi(url: string, body: Record<string, unknown>) {
    setState('loading')
    setMessage('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Erro desconhecido')
      } else {
        setState('success')
        setMessage('Operação realizada com sucesso!')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch {
      setState('error')
      setMessage('Erro de rede. Tente novamente.')
    }
  }

  function grantPro(days: number) {
    callApi(`/api/admin/users/${userId}/grant-pro`, { days })
  }

  function cancelPro() {
    if (!confirm('Tem certeza que deseja cancelar o PRO deste usuário?')) return
    callApi(`/api/admin/users/${userId}/cancel`, {})
  }

  function toggleRole(newRole: string) {
    if (!confirm(`Alterar role para "${newRole}"?`)) return
    callApi(`/api/admin/users/${userId}/toggle-role`, { role: newRole })
  }

  const isLoading = state === 'loading'

  return (
    <div className="bg-[#111111] border border-white/[0.08] rounded-lg p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">Ações do administrador</p>

      {/* Status message */}
      {state !== 'idle' && message && (
        <div
          className={cn(
            'px-3 py-2 rounded-md text-xs font-medium',
            state === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-red-500/15 text-red-400 border border-red-500/25'
          )}
        >
          {message}
        </div>
      )}

      {/* PRO actions */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 font-medium">Plano PRO</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => grantPro(30)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-md hover:bg-emerald-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Conceder PRO 30 dias'}
          </button>
          <button
            onClick={() => grantPro(365)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-md hover:bg-emerald-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Conceder PRO 1 ano'}
          </button>
          {currentPlan === 'pro' && (
            <button
              onClick={cancelPro}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-red-500/15 text-red-400 border border-red-500/25 rounded-md hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Cancelar PRO'}
            </button>
          )}
        </div>
      </div>

      {/* Role actions */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <p className="text-xs text-gray-500 font-medium">Role de acesso</p>
        <div className="flex gap-2">
          {currentRole !== 'admin' ? (
            <button
              onClick={() => toggleRole('admin')}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-red-500/15 text-red-400 border border-red-500/25 rounded-md hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Tornar Admin'}
            </button>
          ) : (
            <button
              onClick={() => toggleRole('user')}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs bg-gray-500/15 text-gray-400 border border-gray-500/25 rounded-md hover:bg-gray-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Remover Admin'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
