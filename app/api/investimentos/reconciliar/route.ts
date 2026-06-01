// POST /api/investimentos/reconciliar
// Cancela lançamentos investment_aporte/resgate que não têm mais uma operação ativa vinculada.
// Ocorre quando operações são canceladas/ativos excluídos sem a correção do sistema.

import {
  getApiUser,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    // IDs de lançamentos que ainda têm operação confirmada vinculada
    const operacoesAtivas = await prisma.investimentoOperacao.findMany({
      where: {
        userId: user.id,
        status: 'confirmada',
        lancamentoId: { not: null },
      },
      select: { lancamentoId: true },
    })
    const idsProtegidos = operacoesAtivas
      .map(op => op.lancamentoId)
      .filter((id): id is string => id !== null)

    // Cancela todos os lançamentos de investimento órfãos (sem operação ativa)
    const result = await prisma.lancamento.updateMany({
      where: {
        userId: user.id,
        tipo: { in: ['investment_aporte', 'investment_resgate'] },
        status: 'confirmada',
        ...(idsProtegidos.length > 0 ? { id: { notIn: idsProtegidos } } : {}),
      },
      data: { status: 'cancelada' },
    })

    return okResponse({ cancelados: result.count })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
