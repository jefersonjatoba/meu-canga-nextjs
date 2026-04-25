import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'
import { validateCPF } from './utils'

// NOTE: This is a development stub.
// Production implementation should:
// - Hash passwords with bcrypt
// - Validate against the database
// - Enforce HTTPS
const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'CPF',
      credentials: {
        cpf: { label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const cpf = credentials?.cpf as string | undefined
        const password = credentials?.password as string | undefined

        if (!cpf || !password) {
          throw new Error('CPF e senha são obrigatórios')
        }

        if (!validateCPF(cpf)) {
          throw new Error('CPF inválido')
        }

        // TODO: Validate against database
        // const user = await db.user.findUnique({ where: { cpf } })
        // if (!user || !await bcrypt.compare(password, user.password)) {
        //   throw new Error('CPF ou senha incorretos')
        // }

        // Development mock user
        return {
          id: '1',
          email: 'user@example.com',
          name: 'User Example',
          cpf,
          role: 'user',
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.cpf = (user as Record<string, unknown>).cpf
        token.role = (user as Record<string, unknown>).role ?? 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extUser = session.user as any
        extUser.id = token.id
        extUser.cpf = token.cpf
        extUser.role = token.role
      }
      return session
    },
  },
}

export const { auth, handlers } = NextAuth(authConfig)
