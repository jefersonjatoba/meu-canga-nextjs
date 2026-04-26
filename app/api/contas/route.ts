// GET /api/contas — list the authenticated user's accounts.
// Auto-creates a default "Minha Conta" on first use so new users can
// immediately create lancamentos without a separate onboarding step.

import { getApiUser, okResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    let contas = await prisma.conta.findMany({
      where:   { userId: user.id, ativa: true },
      select:  { id: true, nome: true, tipo: true },
      orderBy: { createdAt: 'asc' },
    })

    if (contas.length === 0) {
      const conta = await prisma.conta.create({
        data:   { userId: user.id, nome: 'Minha Conta', tipo: 'checking' },
        select: { id: true, nome: true, tipo: true },
      })
      contas = [conta]
    }

    return okResponse(contas)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
