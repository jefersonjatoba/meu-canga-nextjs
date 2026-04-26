import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { okResponse, serverErrorResponse } from '@/lib/api-auth'

// ─── GET /api/cron/ras-transition ────────────────────────────────────────────
// Invocado pelo Vercel Cron Jobs diariamente à meia-noite (horário de Brasília).
// Transiciona automaticamente: realizado → pendente quando expiresAt passou.
// Protegido por CRON_SECRET no header Authorization.

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || secret !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Busca todos os RAS com status 'realizado' cujo expiresAt já passou
    const expirados = await prisma.rasAgenda.findMany({
      where: {
        status: 'realizado',
        expiresAt: { lte: now },
      },
      select: { id: true, userId: true, local: true, data: true, expiresAt: true },
    })

    if (expirados.length === 0) {
      return okResponse({ transicionados: 0, ids: [] })
    }

    // Atualiza em batch para 'pendente'
    const result = await prisma.rasAgenda.updateMany({
      where: {
        id: { in: expirados.map((r) => r.id) },
        status: 'realizado',
        expiresAt: { lte: now },
      },
      data: { status: 'pendente' },
    })

    console.log(
      `[cron/ras-transition] ${result.count} RAS transicionados realizado→pendente`,
      expirados.map((r) => r.id)
    )

    return okResponse({
      transicionados: result.count,
      ids: expirados.map((r) => r.id),
      executadoEm: now.toISOString(),
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
