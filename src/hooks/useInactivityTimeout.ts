'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000 // 5 minutos
const STORAGE_KEY = 'mc_last_activity'
const CHECK_INTERVAL_MS = 30_000 // verifica a cada 30s enquanto a aba está aberta

export const updateActivity = () => {
  try {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  } catch {}
}

export const getLastActivity = (): number => {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
  } catch {
    return 0
  }
}

export const isSessionExpired = (): boolean => {
  const last = getLastActivity()
  if (!last) return false // nunca registrado = sessão nova, não expirada
  return Date.now() - last > INACTIVITY_LIMIT_MS
}

export function useInactivityTimeout() {
  const { isAuthenticated, signOut } = useAuth()
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const forceSignOut = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      await signOut()
    } catch {}
    router.replace('/auth/login?sessao=expirada')
  }, [signOut, router])

  const checkExpiry = useCallback(() => {
    if (!isAuthenticated) return
    if (isSessionExpired()) {
      forceSignOut()
    }
  }, [isAuthenticated, forceSignOut])

  useEffect(() => {
    if (!isAuthenticated) return

    // Registra atividade inicial ao entrar no dashboard
    updateActivity()

    // Atualiza timestamp em qualquer interação do usuário
    const EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'pointermove']
    EVENTS.forEach(e => window.addEventListener(e, updateActivity, { passive: true }))

    // Verifica ao retornar à aba (usuário fechou e reabriu)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiry()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Verifica periodicamente enquanto a aba está aberta
    intervalRef.current = setInterval(checkExpiry, CHECK_INTERVAL_MS)

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, updateActivity))
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated, checkExpiry])
}
