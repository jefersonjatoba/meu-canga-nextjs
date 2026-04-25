'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar sessão ao carregar
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || ''
          })
        }
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || ''
          })
        } else {
          setUser(null)
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