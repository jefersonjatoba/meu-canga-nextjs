// Internal API — RAS checks job (direct execution, not via Bull)
// Runs RAS expiry checks directly without queue
// Callable by external cron service (EasyCron, Vercel Cron, etc)

import { NextRequest, NextResponse } from 'next/server'
import { processExpiredRas, notifyRasAwaitingConfirmation } from '@/server/jobs/ras-expiry'

const JOB_TOKEN = process.env.JOB_TOKEN || 'dev-token-change-in-production'

/**
 * GET /api/internal/jobs/ras-checks
 *
 * Runs RAS expiry checks directly:
 * 1. Auto-transitions realizado → pendente for expired RAS
 * 2. Sends 24h reminders for RAS about to expire
 *
 * Requires Authorization header: "Bearer {JOB_TOKEN}"
 *
 * This endpoint does NOT use Bull queue — it executes directly.
 * For production, consider: EasyCron, Vercel Crons, or Railway crons.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    if (token !== JOB_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    const startTime = Date.now()

    // Run both jobs in parallel
    const [expiredCount, notifiedCount] = await Promise.all([
      processExpiredRas(),
      notifyRasAwaitingConfirmation(),
    ])

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        expiredRasTransitioned: expiredCount,
        usersNotified: notifiedCount,
      },
      duration: `${duration}ms`,
    })
  } catch (error) {
    console.error('[ras-checks-api] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
