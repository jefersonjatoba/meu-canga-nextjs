import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

function serializeConfig(c: {
  userId: string
  tipo: string
  horaInicio: string
  horaFim: string
  inicioCiclo: string
  localServico: string | null
  alarmeAtivo: boolean
  atualizadoEm: Date
}) {
  return {
    id: c.userId,
    userId: c.userId,
    tipo: c.tipo,
    horaInicio: c.horaInicio,
    horaFim: c.horaFim,
    inicioCiclo: c.inicioCiclo,
    local: c.localServico ?? null,
    alarmeAtivo: c.alarmeAtivo,
    updatedAt: c.atualizadoEm.toISOString(),
  }
}

// GET /api/escala/config
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const config = await prisma.escalaConfig.findUnique({ where: { userId } })

    return NextResponse.json({ config: config ? serializeConfig(config) : null })
  } catch (error) {
    console.error('[GET /api/escala/config]', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

// POST /api/escala/config — body: { tipo, horaInicio, horaFim, inicioCiclo, local?, alarmeAtivo? }
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { tipo, horaInicio, horaFim, inicioCiclo, local, alarmeAtivo } = body

    if (!tipo || !horaInicio || !horaFim || !inicioCiclo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, horaInicio, horaFim, inicioCiclo' },
        { status: 400 }
      )
    }

    const config = await prisma.escalaConfig.upsert({
      where: { userId },
      update: {
        tipo,
        horaInicio,
        horaFim,
        inicioCiclo,
        localServico: local || null,
        alarmeAtivo: alarmeAtivo !== false,
        atualizadoEm: new Date(),
      },
      create: {
        userId,
        tipo,
        horaInicio,
        horaFim,
        inicioCiclo,
        localServico: local || null,
        alarmeAtivo: alarmeAtivo !== false,
      },
    })

    return NextResponse.json({ config: serializeConfig(config) })
  } catch (error) {
    console.error('[POST /api/escala/config]', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}

// DELETE /api/escala/config — apaga config e todas as escalas do usuário
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    await prisma.escalaConfig.deleteMany({ where: { userId } })
    await prisma.escala.deleteMany({ where: { userId } })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[DELETE /api/escala/config]', error)
    return NextResponse.json({ error: 'Erro ao remover dados' }, { status: 500 })
  }
}
