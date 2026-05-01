'use client'

/**
 * useAuth — thin wrapper around AuthContext.
 *
 * All state lives in AuthProvider (one singleton instance at the root of the
 * app). This hook simply reads from that shared context, so every component
 * that calls useAuth() sees the SAME loading/user values and no component
 * creates its own Supabase listener.
 */

export { useAuthContext as useAuth } from '@/contexts/AuthContext'
