import { getCurrentUser } from '@/server/auth/get-current-user'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const hoje = new Date()
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)
    const dataLimiteStr = dataLimite.toISOString().split('T')[0]

    // RAS confirmados de ~30 dias atrás
    const rasConfirmados = await prisma.rasAgenda.findMany({
      where: {
        userId: user.id,
        deletadoEm: null,
        status: 'confirmado',
        data: {
          lte: new Date(`${dataLimiteStr}T23:59:59Z`),
        },
      },
      orderBy: { data: 'desc' },
      select: {
        id: true,
        data: true,
        duracao: true,
        valorCentavos: true,
        competencia: true,
      },
      take: 20,
    })

    // Todos os RAS confirmados (sem limite de 30 dias)
    const todosConfirmados = await prisma.rasAgenda.findMany({
      where: {
        userId: user.id,
        deletadoEm: null,
        status: 'confirmado',
      },
      orderBy: { data: 'desc' },
      select: {
        id: true,
        data: true,
        duracao: true,
        valorCentavos: true,
        competencia: true,
      },
      take: 20,
    })

    // RAS do mês anterior (alternativa)
    const mesAtual = hoje.toISOString().split('T')[0].slice(0, 7) // YYYY-MM
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0]
      .slice(0, 7)

    const rasDoMesAnterior = await prisma.rasAgenda.findMany({
      where: {
        userId: user.id,
        deletadoEm: null,
        competencia: mesAnterior,
        status: { notIn: ['cancelado', 'agendado'] },
      },
      orderBy: { data: 'desc' },
      select: {
        id: true,
        data: true,
        duracao: true,
        valorCentavos: true,
        status: true,
        competencia: true,
      },
      take: 20,
    })

    return NextResponse.json({
      debug: {
        hoje: hoje.toISOString(),
        dataLimite30dias: dataLimiteStr,
        mesAtual,
        mesAnterior,
      },
      rasConfirmadosDe30DiasAtras: {
        count: rasConfirmados.length,
        totalValor: rasConfirmados.reduce((sum, r) => sum + r.valorCentavos, 0),
        totalHoras: rasConfirmados.reduce((sum, r) => sum + r.duracao, 0),
        items: rasConfirmados,
      },
      todosRasConfirmados: {
        count: todosConfirmados.length,
        items: todosConfirmados,
      },
      rasDoMesAnterior: {
        count: rasDoMesAnterior.length,
        items: rasDoMesAnterior,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
