import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

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

// GET /api/escala/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const escala = await prisma.escala.findUnique({ where: { id } })
    if (!escala) return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })
    if (escala.userId !== userId) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    return NextResponse.json({ escala: serializeEscala(escala) })
  } catch (err) {
    console.error('[GET /api/escala/[id]]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT /api/escala/[id] — aceita { data?, horaInicio?, horaFim?, tipo?, local?, observacao?, alarmeAtivo? }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.escala.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })
    if (existing.userId !== userId) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (body.data) {
      const [ano, mes, dia] = (body.data as string).split('-').map(Number)
      updates.dataEscala = new Date(Date.UTC(ano, mes - 1, dia))
    }
    if (body.horaInicio !== undefined) updates.horaInicio = body.horaInicio
    if (body.horaFim !== undefined) updates.horaFim = body.horaFim
    if (body.tipo !== undefined) updates.tipoTurno = body.tipo
    if (body.local !== undefined) updates.localServico = body.local || null
    if (body.observacao !== undefined) updates.observacoes = body.observacao || null
    if (body.alarmeAtivo !== undefined) updates.alarmeAtivo = body.alarmeAtivo

    const updated = await prisma.escala.update({ where: { id }, data: updates })

    return NextResponse.json({ escala: serializeEscala(updated) })
  } catch (err) {
    console.error('[PUT /api/escala/[id]]', err)
    return NextResponse.json({ error: 'Erro ao atualizar escala' }, { status: 500 })
  }
}

// PATCH /api/escala/[id] — aceita mesmos campos que PUT
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context)
}

// DELETE /api/escala/[id] — soft-cancel (status = 'cancelada')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.escala.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })
    if (existing.userId !== userId) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    await prisma.escala.update({ where: { id }, data: { status: 'cancelada' } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/escala/[id]]', err)
    return NextResponse.json({ error: 'Erro ao remover escala' }, { status: 500 })
  }
}
