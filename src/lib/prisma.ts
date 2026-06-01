// Prisma Client singleton — prevents exhausting the connection pool in dev
// due to Next.js hot-reload creating a new PrismaClient on every module reload.
// Em serverless (Vercel), globalThis não persiste entre invocações — cada cold start
// cria um novo cliente. O connection_limit=1 na DATABASE_URL é obrigatório.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
