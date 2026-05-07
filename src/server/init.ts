// Server initialization — lazy loading for background jobs
// Imports Bull only when explicitly needed (not in Next.js build)

let initialized = false
let schedulingPromise: Promise<void> | null = null

/**
 * Initialize Bull queue for RAS checks
 * Called lazily only from API routes, never from layout
 *
 * Safe to call multiple times (idempotent)
 */
export async function initializeRasQueue(): Promise<void> {
  // Avoid duplicate initialization
  if (schedulingPromise) {
    return schedulingPromise
  }

  if (initialized) {
    console.log('[init] RAS queue already initialized')
    return
  }

  // Set promise first to prevent race conditions
  schedulingPromise = (async () => {
    try {
      console.log('[init] Initializing RAS queue...')

      // Lazy import to avoid Bull bundling in Next.js build
      const { scheduleRasChecks } = await import('@/server/queues/ras-queue')

      await scheduleRasChecks()

      console.log('[init] ✅ RAS queue initialization complete')
      initialized = true
    } catch (error) {
      console.error('[init] RAS queue initialization error:', error instanceof Error ? error.message : String(error))
      throw error
    }
  })()

  return schedulingPromise
}

/**
 * Graceful shutdown — call before process exits
 */
export async function shutdownServer(): Promise<void> {
  try {
    console.log('[shutdown] Closing server services...')

    if (initialized) {
      // Lazy import to avoid Bull bundling
      const { default: rasQueue } = await import('@/server/queues/ras-queue')
      await rasQueue.close()
    }

    console.log('[shutdown] ✅ Server shutdown complete')
  } catch (error) {
    console.error('[shutdown] Error during shutdown:', error instanceof Error ? error.message : String(error))
  }
}

// Handle graceful shutdown on process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('[process] SIGTERM received, shutting down gracefully...')
    shutdownServer().then(() => process.exit(0))
  })

  process.on('SIGINT', () => {
    console.log('[process] SIGINT received, shutting down gracefully...')
    shutdownServer().then(() => process.exit(0))
  })
}
