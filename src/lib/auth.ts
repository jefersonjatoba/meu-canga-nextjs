import { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { validateCPF } from './utils'

// NOTA: Este é um exemplo básico. Em produção:
// - Hash as senhas com bcrypt
// - Valide contra banco de dados
// - Use HTTPS sempre
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'CPF',
      credentials: {
        cpf: { label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.cpf || !credentials?.password) {
          throw new Error('CPF e senha são obrigatórios')
        }

        // Valida CPF
        if (!validateCPF(credentials.cpf)) {
          throw new Error('CPF inválido')
        }

        // TODO: Buscar usuário no banco de dados
        // const user = await db.user.findUnique({ where: { cpf: credentials.cpf } })
        // if (!user || !await bcrypt.compare(credentials.password, user.password)) {
        //   throw new Error('CPF ou senha incorretos')
        // }

        // Mock user para desenvolvimento
        return {
          id: '1',
          email: 'user@example.com',
          name: 'User Example',
          cpf: credentials.cpf,
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
        token.cpf = (user as any).cpf
        token.role = (user as any).role || 'user'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        (session.user as any).cpf = token.cpf
        (session.user as any).role = token.role
      }
      return session
    },
  },
}
