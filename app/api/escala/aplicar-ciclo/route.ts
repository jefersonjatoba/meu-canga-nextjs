import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TipoEscala } from '@/lib/escala'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

// Dias de trabalho/descanso para cada tipo de escala
const ESCALA_CICLOS: Record<TipoEscala, { trabalha: number; descansa: number }> = {
  '24x72': { trabalha: 1, descansa: 3 },
  '24x48': { trabalha: 1, descansa: 2 },
  '12x24-12x72': { trabalha: 0.5, descansa: 2 }, // 12h trabalha, 24h descansa, 12h trabalha, 72h descansa
  '12x24-12x48': { trabalha: 0.5, descansa: 1.5 },
  '12x36-folgao': { trabalha: 0.5, descansa: 1.5 },
}

/**
 * POST /api/escala/aplicar-ciclo
 *
 * Body: { dataInicio: string (YYYY-MM-DD), tipo: TipoEscala, horaInicio, horaFim, local?, alarmeAtivo? }
 *
 * Calcula e cria escalas seguindo o ciclo até dezembro do ano atual
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()
    const userId = user.id

    const body = await req.json()
    const { dataInicio, tipo, horaInicio, horaFim, local, alarmeAtivo } = body

    if (!dataInicio || !tipo || !horaInicio || !horaFim) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: dataInicio, tipo, horaInicio, horaFim' },
        { status: 400 }
      )
    }

    const ciclo = ESCALA_CICLOS[tipo as TipoEscala]
    if (!ciclo) {
      return NextResponse.json({ error: 'Tipo de escala inválido' }, { status: 400 })
    }

    // Parse data de início
    const [anoStr, mesStr, diaStr] = dataInicio.split('-')
    const anoInicio = parseInt(anoStr)
    const mesInicio = parseInt(mesStr) - 1 // 0-indexed
    const diaInicio = parseInt(diaStr)

    // Data inicial em UTC
    const dataInicioDate = new Date(Date.UTC(anoInicio, mesInicio, diaInicio))
    const anoAtual = new Date().getFullYear()

    // Gera todas as datas do ciclo até dezembro
    const toCreate = []
    const currentDate = new Date(dataInicioDate)
    let dayCounter = 0
    const cicloTotal = ciclo.trabalha + ciclo.descansa

    // Vai até 31 de dezembro do ano atual
    const dataFim = new Date(Date.UTC(anoAtual, 11, 31, 23, 59, 59))

    while (currentDate <= dataFim) {
      // Determina se está na parte de "trabalha" do ciclo
      const posicaoCiclo = dayCounter % cicloTotal
      const estaTrabalhandoPrimeiraParte = posicaoCiclo < ciclo.trabalha

      if (estaTrabalhandoPrimeiraParte) {
        toCreate.push({
          userId,
          dataEscala: new Date(currentDate),
          horaInicio,
          horaFim,
          tipoTurno: 'plantao',
          localServico: local || null,
          observacoes: null,
          alarmeAtivo: alarmeAtivo !== undefined ? alarmeAtivo : true,
        })
      }

      // Avança para o próximo dia
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
      dayCounter++
    }

    // Verifica duplicatas antes de criar
    const existingDates = await prisma.escala.findMany({
      where: {
        userId,
        dataEscala: {
          gte: dataInicioDate,
          lte: dataFim,
        },
      },
      select: { dataEscala: true },
    })
    const existingSet = new Set(
      existingDates.map((e) => e.dataEscala.toISOString().slice(0, 10))
    )

    const filtered = toCreate.filter(
      (e) => !existingSet.has(e.dataEscala.toISOString().slice(0, 10))
    )

    if (filtered.length > 0) {
      await prisma.escala.createMany({ data: filtered })
    }

    return NextResponse.json({
      created: filtered.length,
      total: toCreate.length,
      skipped: toCreate.length - filtered.length,
    })
  } catch (error) {
    console.error('[POST /api/escala/aplicar-ciclo]', error)
    return NextResponse.json({ error: 'Erro ao aplicar ciclo' }, { status: 500 })
  }
}
