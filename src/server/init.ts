// Server initialization — placeholder for future background job setup
// RAS checks run via GitHub Actions → /api/internal/jobs/ras-checks (no persistent queue needed)

export async function initializeRasQueue(): Promise<void> {
  // No-op: RAS jobs are triggered externally via GitHub Actions cron
  // Kept for interface compatibility in case callers exist
}

export async function shutdownServer(): Promise<void> {
  // No-op: no persistent connections to close
}
