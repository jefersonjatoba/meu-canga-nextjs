'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/auth'

// Salva o access token num cookie lido pelas API routes (getApiUser)
function setSbTokenCookie(token: string | null) {
  if (typeof document === 'undefined') return
  if (token) {
    document.cookie = `sb-token=${token}; path=/; max-age=3600; SameSite=Lax`
  } else {
    document.cookie = `sb-token=; path=/; max-age=0`
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Tentar usar cached auth state primeiro
    const cachedSession = typeof window !== 'undefined'
      ? localStorage.getItem('sb-auth-cache')
      : null

    if (cachedSession) {
      try {
        const session = JSON.parse(cachedSession)
        setUser({
          id: session.id,
          email: session.email || '',
          created_at: session.created_at || ''
        })
        setLoading(false)
      } catch {
        localStorage.removeItem('sb-auth-cache')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }

    // Verificar sessão em background se houver cache
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || ''
          }
          setUser(userData)
          localStorage.setItem('sb-auth-cache', JSON.stringify(userData))
          // Disponibilizar token para API routes server-side
          setSbTokenCookie(session.access_token)
        } else if (!cachedSession) {
          setUser(null)
          setSbTokenCookie(null)
        }
      } catch (err) {
        console.error('Auth check error:', err)
      }
    }

    // Executar verificação após a página renderizar em idle time
    const timer = setTimeout(() => {
      checkAuth()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Listener para mudanças de autenticação (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || ''
          }
          setUser(userData)
          localStorage.setItem('sb-auth-cache', JSON.stringify(userData))
          // Atualizar cookie sempre que o token mudar (login, refresh, etc.)
          setSbTokenCookie(session.access_token)
        } else {
          setUser(null)
          localStorage.removeItem('sb-auth-cache')
          setSbTokenCookie(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login')
      throw err
    }
  }

  // Função de registro
  const signUp = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no registro')
      throw err
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no logout')
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  }
}