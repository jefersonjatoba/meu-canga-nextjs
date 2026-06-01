// NextAuth v5 — módulo mantido apenas para compatibilidade estrutural.
// A autenticação real é feita exclusivamente via Supabase (AuthContext).
// Não há providers ativos: o endpoint /api/auth/* não autentica ninguém.
import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'

const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
}

export const { auth, handlers } = NextAuth(authConfig)
