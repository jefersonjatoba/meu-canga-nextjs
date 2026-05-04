import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as rasService from '@/server/services/ras.service'

// ─── POST /api/cron/ras-transition ───────────────────────────────────────────
// Transiciona automaticamente: realizado → pendente quando expiresAt passou.
// Protegido por X-Cron-Secret header (ou Authorization: Bearer para Vercel Cron).
// Itera cada RAS individualmente via rasService.marcarPendente para garantir
// que a state machine e os side-effects sejam respeitados.

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  // Suporte a X-Cron-Secret (chamadas manuais / external cron services)
  const xCronSecret = request.headers.get('X-Cron-Secret')
  if (xCronSecret === cronSecret) return true

  // Suporte a Authorization: Bearer (Vercel Cron Jobs usa este formato)
  const authorization = request.headers.get('authorization')
  if (authorization === `Bearer ${cronSecret}`) return true

  return false
}

async function runTransition(): Promise<{
  updated: number
  errors: string[]
  timestamp: string
}> {
  // Buscar RAS com status 'realizado' e expiresAt vencido (paginado em 1000)
  const expired = await prisma.rasAgenda.findMany({
    where: {
      status: 'realizado',
      expiresAt: { lte: new Date() },
    },
    select: { id: true, userId: true },
    take: 1000,
  })

  const results = {
    updated: 0,
    errors: [] as string[],
  }

  // Iterar individualmente para que a state machine do service seja respeitada
  // e para que um falho não cancele os demais (idempotência garantida pelo assertTransition)
  for (const ras of expired) {
    try {
      await rasService.marcarPendente(ras.id, ras.userId)
      results.updated++
    } catch (err) {
      results.errors.push(`RAS ${ras.id}: ${String(err)}`)
    }
  }

  return {
    ...results,
    timestamp: new Date().toISOString(),
  }
}

// POST — chamadas manuais e external cron services (X-Cron-Secret)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runTransition()

    console.log(
      `[cron/ras-transition] POST — ${result.updated} RAS transicionados realizado→pendente`,
      result.errors.length > 0 ? { errors: result.errors } : undefined,
    )

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[cron/ras-transition] POST error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 },
    )
  }
}

// GET — Vercel Cron Jobs (sempre usa GET com Authorization: Bearer)
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runTransition()

    console.log(
      `[cron/ras-transition] GET — ${result.updated} RAS transicionados realizado→pendente`,
      result.errors.length > 0 ? { errors: result.errors } : undefined,
    )

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[cron/ras-transition] GET error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 },
    )
  }
}
