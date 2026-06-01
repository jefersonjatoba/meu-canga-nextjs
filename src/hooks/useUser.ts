'use client'

import { useAuth } from './useAuth'
import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SessionUser } from '@/types'

async function fetchPerfil(): Promise<{ id: string; name: string; email: string; plan: string; role: string }> {
  const res = await fetch('/api/perfil')
  if (!res.ok) throw new Error('Falha ao carregar perfil')
  return res.json()
}

export function useUser() {
  const { user: supabaseUser, loading } = useAuth()
  const { user, setUser } = useUserStore()

  const { data: perfil } = useQuery({
    queryKey: ['perfil'],
    queryFn: fetchPerfil,
    enabled: !!supabaseUser,  // só busca se autenticado
    staleTime: 10 * 60 * 1000, // 10 min — nome/email raramente mudam
  })

  useEffect(() => {
    if (supabaseUser && perfil) {
      const userData: SessionUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: perfil.name,
        cpf: '',
        role: perfil.role as 'user' | 'admin',
      }
      setUser(userData)
    } else if (!loading && !supabaseUser) {
      setUser(null)
    }
  }, [supabaseUser, perfil, loading, setUser])

  return {
    user,
    isLoading: loading,
    isAuthenticated: !!supabaseUser,
  }
}
