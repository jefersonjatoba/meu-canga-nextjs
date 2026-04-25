'use client'

import { useAuth } from './useAuth'
import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'
import type { SessionUser } from '@/types'

/**
 * useUser — derives SessionUser from the Supabase auth session and keeps
 * the Zustand userStore in sync. Single source of truth: Supabase.
 */
export function useUser() {
  const { user: supabaseUser, loading } = useAuth()
  const { user, setUser } = useUserStore()

  useEffect(() => {
    if (supabaseUser) {
      const userData: SessionUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.email.split('@')[0], // fallback until profile table is set up
        cpf: '',
        role: 'user',
      }
      setUser(userData)
    } else if (!loading) {
      setUser(null)
    }
  }, [supabaseUser, loading, setUser])

  return {
    user,
    isLoading: loading,
    isAuthenticated: !!supabaseUser,
  }
}
