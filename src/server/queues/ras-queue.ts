// RAS Queue — Bull queue for background jobs
// Runs on Redis, processes RAS expiry checks and notifications

import Queue from 'bull'
import { processExpiredRas, notifyRasAwaitingConfirmation } from '@/server/jobs/ras-expiry'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Upstash usa TLS (rediss://) — ioredis precisa de tls: {} para aceitar self-signed
const isTLS = REDIS_URL.startsWith('rediss://')

// Queue for RAS checks (expiry + notifications)
export const rasQueue = new Queue('ras-checks', REDIS_URL, {
  redis: isTLS ? { tls: { rejectUnauthorized: false } } : undefined,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
  settings: {
    maxStalledCount: 2,
    stalledInterval: 5000,
    lockDuration: 30000,
    lockRenewTime: 15000,
  },
})

// Process expiry checks — runs the actual job
rasQueue.process('expiry-check', async (job) => {
  console.log(`[ras-queue] Processing expiry check (job ${job.id})`)

  try {
    const [expiredCount, notifiedCount] = await Promise.all([
      processExpiredRas(),
      notifyRasAwaitingConfirmation(),
    ])

    return {
      success: true,
      expiredCount,
      notifiedCount,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`[ras-queue] Job failed:`, error instanceof Error ? error.message : String(error))
    throw error
  }
})

// Event listeners
rasQueue.on('completed', (job, result) => {
  console.log(`[ras-queue] Job ${job.id} completed:`, result)
})

rasQueue.on('failed', (job, err) => {
  console.error(`[ras-queue] Job ${job.id} failed:`, err.message)
})

rasQueue.on('error', (error) => {
  console.error('[ras-queue] Queue error:', error)
})

/**
 * Schedule recurring expiry check
 * Runs every hour at :00 minute
 *
 * Call this on app startup (in layout or middleware)
 */
export async function scheduleRasChecks(): Promise<void> {
  try {
    // Clear old recurring jobs to avoid duplicates
    const jobs = await rasQueue.getRepeatableCount()
    if (jobs > 0) {
      console.log(`[ras-queue] Found ${jobs} existing recurring jobs, clearing...`)
      await rasQueue.removeRepeatableByKey('expiry-check:0 * * * *')
    }

    // Add new recurring job: every hour
    await rasQueue.add('expiry-check', {}, {
      repeat: {
        cron: '0 * * * *', // Every hour at :00
        tz: 'America/Sao_Paulo',
      },
      jobId: 'recurring-ras-expiry-check',
    })

    console.log('[ras-queue] ✅ Scheduled recurring RAS expiry checks (hourly)')
  } catch (error) {
    console.error('[ras-queue] Error scheduling recurring job:', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Trigger an immediate RAS check (useful for testing or manual runs)
 */
export async function triggerRasCheckNow(): Promise<string> {
  const job = await rasQueue.add('expiry-check', {}, {
    priority: 10, // High priority
  })
  console.log(`[ras-queue] Triggered immediate check (job ${job.id})`)
  return String(job.id)
}

/**
 * Get queue stats for monitoring
 */
export async function getRasQueueStats() {
  return {
    waiting: await rasQueue.getWaitingCount(),
    active: await rasQueue.getActiveCount(),
    completed: await rasQueue.getCompletedCount(),
    failed: await rasQueue.getFailedCount(),
    delayed: await rasQueue.getDelayedCount(),
  }
}

export default rasQueue
