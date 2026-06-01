'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { isSessionExpired, updateActivity } from '@/hooks/useInactivityTimeout'

// Exibido na landing page: se autenticado E sessão ativa → redireciona para dashboard
// Se autenticado MAS sessão expirada → faz logout silencioso e permanece na landing
export function AuthRedirect() {
  const { isAuthenticated, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (isAuthenticated) {
      if (isSessionExpired()) {
        // Sessão expirou — faz logout silencioso, usuário continua na landing
        signOut().catch(() => {})
      } else {
        // Sessão ativa — redireciona para dashboard
        updateActivity()
        router.replace('/dashboard')
      }
    }
  }, [isAuthenticated, loading, signOut, router])

  return null
}
