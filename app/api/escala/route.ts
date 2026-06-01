import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

function serializeEscala(e: {
  id: string
  userId: string
  dataEscala: Date
  horaInicio: string
  horaFim: string
  tipoTurno: string
  localServico: string | null
  observacoes: string | null
  alarmeAtivo: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
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
  }
}

// GET /api/escala?ano=2026&mes=5
export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()
    const userId = user.id

    const params = request.nextUrl.searchParams
    const ano = parseInt(params.get('ano') ?? '')
    const mes = parseInt(params.get('mes') ?? '')

    if (!ano || !mes) {
      return NextResponse.json({ error: 'Parâmetros ano e mes são obrigatórios' }, { status: 400 })
    }

    const startDate = new Date(Date.UTC(ano, mes - 1, 1))
    const endDate = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999))

    const escalas = await prisma.escala.findMany({
      where: {
        userId,
        dataEscala: { gte: startDate, lte: endDate },
        status: { not: 'cancelada' },
      },
      orderBy: { dataEscala: 'asc' },
    })

    return NextResponse.json({ escalas: escalas.map(serializeEscala) })
  } catch (error) {
    console.error('[GET /api/escala]', error)
    return NextResponse.json({ error: 'Erro ao buscar escalas' }, { status: 500 })
  }
}

// POST /api/escala — body: { data, horaInicio, horaFim, tipo, local?, observacao?, alarmeAtivo? }
export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()
    const userId = user.id

    const body = await request.json()
    const { data: dataStr, horaInicio, horaFim, tipo, local, observacao, alarmeAtivo } = body

    if (!dataStr || !horaInicio || !horaFim || !tipo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: data, horaInicio, horaFim, tipo' },
        { status: 400 }
      )
    }

    const [ano, mes, dia] = (dataStr as string).split('-').map(Number)
    const dataEscala = new Date(Date.UTC(ano, mes - 1, dia))

    // Idempotência: pula se já existe escala na mesma data/hora
    const existing = await prisma.escala.findFirst({
      where: { userId, dataEscala, horaInicio, status: { not: 'cancelada' } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma escala para esta data e horário' },
        { status: 409 }
      )
    }

    const escala = await prisma.escala.create({
      data: {
        userId,
        dataEscala,
        horaInicio,
        horaFim,
        tipoTurno: tipo,
        localServico: local || null,
        observacoes: observacao || null,
        alarmeAtivo: alarmeAtivo !== undefined ? alarmeAtivo : true,
        status: 'agendada',
      },
    })

    return NextResponse.json({ escala: serializeEscala(escala) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/escala]', error)
    return NextResponse.json({ error: 'Erro ao criar escala' }, { status: 500 })
  }
}
