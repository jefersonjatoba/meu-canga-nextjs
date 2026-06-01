import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

/**
 * POST /api/escala/aplicar-padrao
 *
 * Body: { dias: number[], ano: number, mes: number, horaInicio: string, horaFim: string, local?: string, alarmeAtivo?: boolean }
 *
 * Cria plantões para os dias informados (idempotente — pula dias que já têm escala
 * com o mesmo horaInicio). Reproduz o "Aplicar ao mês" do v1.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()
    const userId = user.id

    const body = await req.json()
    const {
      dias,
      ano,
      mes,
      horaInicio,
      horaFim,
      local,
      alarmeAtivo,
    } = body as {
      dias: number[]
      ano: number
      mes: number
      horaInicio: string
      horaFim: string
      local?: string
      alarmeAtivo?: boolean
    }

    if (!Array.isArray(dias) || !ano || !mes || !horaInicio || !horaFim) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: dias[], ano, mes, horaInicio, horaFim' },
        { status: 400 },
      )
    }

    // Carrega escalas existentes do mês para evitar duplicatas
    const startDate = new Date(Date.UTC(ano, mes - 1, 1))
    const endDate = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999))
    const existing = await prisma.escala.findMany({
      where: { userId, dataEscala: { gte: startDate, lte: endDate } },
      select: { dataEscala: true, horaInicio: true },
    })
    const existingKeys = new Set(
      existing.map((e) => `${e.dataEscala.toISOString().slice(0, 10)}|${e.horaInicio}`),
    )

    const toCreate = dias
      .map((d) => {
        const dataDate = new Date(Date.UTC(ano, mes - 1, d))
        const isoData = dataDate.toISOString().slice(0, 10)
        const key = `${isoData}|${horaInicio}`
        if (existingKeys.has(key)) return null
        return {
          userId,
          dataEscala: dataDate,
          horaInicio,
          horaFim,
          tipoTurno: 'plantao',
          localServico: local || null,
          observacoes: null,
          alarmeAtivo: alarmeAtivo !== undefined ? alarmeAtivo : true,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    if (toCreate.length > 0) {
      await prisma.escala.createMany({ data: toCreate })
    }

    return NextResponse.json({
      created: toCreate.length,
      skipped: dias.length - toCreate.length,
    })
  } catch (error) {
    console.error('[POST /api/escala/aplicar-padrao]', error)
    return NextResponse.json({ error: 'Erro ao aplicar padrão' }, { status: 500 })
  }
}
