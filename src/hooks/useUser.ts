'use client'

import { SessionUser } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'

export function useUser() {
  const { data: session, status } = useSession()
  const { user, setUser } = useUserStore()

  // Sincroniza NextAuth session com Zustand store
  useEffect(() => {
    if (session?.user) {
      const userData: SessionUser = {
        id: (session.user as any).id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        cpf: (session.user as any).cpf || '',
        role: (session.user as any).role || 'user',
      }
      setUser(userData)
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser])

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
