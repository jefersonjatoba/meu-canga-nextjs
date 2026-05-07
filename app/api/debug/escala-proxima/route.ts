import { getCurrentUser } from '@/server/auth/get-current-user'
import { prisma } from '@/lib/prisma'
import { getDataHojeSP, toISODateBR } from '@/lib/dates'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const hoje = getDataHojeSP()

    // Fetch all active escalas
    const todasAsEscalas = await prisma.escala.findMany({
      where: { userId: user.id, status: 'agendada' },
      orderBy: { dataEscala: 'asc' },
      select: {
        id: true,
        dataEscala: true,
        horaInicio: true,
        horaFim: true,
        tipoTurno: true,
        localServico: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 10,
    })

    // Convert dates for display
    const escalasFormatted = todasAsEscalas.map(e => ({
      ...e,
      dataISO: toISODateBR(e.dataEscala),
      dataEscalaRaw: e.dataEscala.toISOString(),
    }))

    // Filter >= today
    const proximaEscalaObj = escalasFormatted.find(e => e.dataISO >= hoje)

    return NextResponse.json({
      hoje,
      todasAsEscalas: escalasFormatted,
      proximaEscala: proximaEscalaObj || null,
      filtroComparacao: `dataISO >= "${hoje}"`,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
