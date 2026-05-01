import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

// GET /api/escala/proximos — next 10 upcoming shifts
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // UTC midnight da data "hoje" no fuso de São Paulo (casa com POST que salva via Date.UTC)
    const nowUTC = new Date()
    const nowSP = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const hoje = new Date(Date.UTC(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate()))

    const escalas = await prisma.escala.findMany({
      where: {
        userId,
        data: { gte: hoje },
      },
      orderBy: { data: 'asc' },
      take: 10,
    })

    const serialized = escalas.map((e) => ({
      ...e,
      data: e.data.toISOString().slice(0, 10),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }))

    return NextResponse.json({ escalas: serialized })
  } catch (error) {
    console.error('[GET /api/escala/proximos]', error)
    return NextResponse.json({ error: 'Erro ao buscar próximas escalas' }, { status: 500 })
  }
}
