import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

// GET /api/escala/proximos — next 10 upcoming shifts
export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()
    const userId = user.id

    // UTC midnight da data "hoje" no fuso de São Paulo
    const nowUTC = new Date()
    const nowSP = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const hoje = new Date(Date.UTC(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate()))

    const escalas = await prisma.escala.findMany({
      where: {
        userId,
        dataEscala: { gte: hoje },
        status: { not: 'cancelada' },
      },
      orderBy: { dataEscala: 'asc' },
      take: 10,
    })

    const serialized = escalas.map((e) => ({
      id: e.id,
      userId: e.userId,
      data: e.dataEscala.toISOString().slice(0, 10),
      horaInicio: e.horaInicio,
      horaFim: e.horaFim,
      tipo: e.tipoTurno,
      local: e.localServico ?? null,
      observacao: e.observacoes ?? null,
      alarmeAtivo: e.alarmeAtivo,
      alarmeEnviado: false,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }))

    return NextResponse.json({ escalas: serialized })
  } catch (error) {
    console.error('[GET /api/escala/proximos]', error)
    return NextResponse.json({ error: 'Erro ao buscar próximas escalas' }, { status: 500 })
  }
}
