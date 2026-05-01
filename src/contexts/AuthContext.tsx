'use client'

/**
 * AuthContext — single source of truth for Supabase auth state.
 *
 * Design decisions that prevent the infinite-flicker bug:
 *
 * 1. ONE instance in the React tree (via Provider in app/providers.tsx).
 *    Previously, every component that called useAuth() created its own
 *    supabase.auth.onAuthStateChange listener, which triggered independent
 *    setState calls and cascaded re-renders.
 *
 * 2. We rely SOLELY on onAuthStateChange. Supabase v2 always fires an
 *    INITIAL_SESSION event synchronously-enough on mount, so there is no
 *    need to also call getSession() and risk a race condition between the
 *    two async paths both calling setUser/setLoading.
 *
 * 3. loading starts as true and is set to false exactly once — inside the
 *    onAuthStateChange callback on the first event. No second setLoading
 *    call can sneak in from a parallel getSession() call.
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toUser(su: SupabaseUser): User {
  return {
    id: su.id,
    email: su.email ?? '',
    created_at: su.created_at ?? '',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track whether the first auth event has been processed so we only call
  // setLoading(false) once, preventing additional flickers.
  const initialised = useRef(false)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on mount, giving us
    // the current session without a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ? toUser(session.user) : null
        setUser(nextUser)

        // Only clear the loading spinner on the very first event.
        if (!initialised.current) {
          initialised.current = true
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // empty deps — runs once, cleans up on unmount

  const signIn = async (email: string, password: string) => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      throw err
    }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    const { error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      setError(err.message)
      throw err
    }
  }

  const signOut = async () => {
    setError(null)
    const { error: err } = await supabase.auth.signOut()
    if (err) {
      setError(err.message)
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>')
  }
  return ctx
}
