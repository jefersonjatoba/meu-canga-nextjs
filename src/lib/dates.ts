// Date helpers — timezone-aware for America/Sao_Paulo.
// Always use these instead of raw Date operations when dealing with BR dates.

const TZ = 'America/Sao_Paulo'

// ─── FIX-1: SP Timezone helpers ───────────────────────────────────────────────
// Uses Intl.DateTimeFormat to guarantee correctness at any UTC offset,
// including the critical 00:00–06:00 SP window where UTC and SP dates diverge.

/**
 * Returns today's date in São Paulo timezone as "YYYY-MM-DD".
 * Uses Intl.DateTimeFormat — never toLocaleString().split() which loses timezone.
 * Correct across UTC-5, UTC-4, UTC-3, etc.
 */
export function getDataHojeSP(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  // en-CA locale formats as YYYY-MM-DD natively
  return fmt.format(new Date())
}

/**
 * Returns a Date object representing the current moment.
 * Included for symmetry — JavaScript Dates are always UTC internally;
 * use Intl.DateTimeFormat with TZ to display or compare wall-clock time.
 */
export function getAgoreDateTime(): Date {
  return new Date()
}

/**
 * Returns true if `dateStr` (YYYY-MM-DD) is strictly after today in SP timezone.
 */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getDataHojeSP()
}

/**
 * Returns true if `dateStr` (YYYY-MM-DD) is strictly before today in SP timezone.
 */
export function isDateInPast(dateStr: string): boolean {
  return dateStr < getDataHojeSP()
}

// ─── Original helpers (unchanged) ────────────────────────────────────────────

/** Today's date in Brazil as "YYYY-MM-DD" */
export function todayBR(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
}

/** Current month in Brazil as "YYYY-MM" */
export function currentMonthBR(): string {
  return todayBR().slice(0, 7)
}

/** Convert a Date to "YYYY-MM-DD" using Brazil timezone
 *
 * Special handling: If date is exactly midnight UTC (HH:mm:ss.000Z),
 * treat it as a date-only value (likely stored without timezone awareness).
 * This handles legacy data stored as "2026-05-07T00:00:00.000Z" that should
 * represent "2026-05-07" in São Paulo local time, not UTC.
 */
export function toISODateBR(date: Date): string {
  const isoString = date.toISOString()

  // If date is exactly midnight UTC, interpret as local date (not UTC conversion)
  if (isoString.endsWith('T00:00:00.000Z')) {
    const [dateOnly] = isoString.split('T')
    return dateOnly
  }

  return date.toLocaleDateString('sv-SE', { timeZone: TZ })
}

/** Format a date or ISO string as "DD/MM/YYYY" for display */
export function formatDateBR(dateOrStr: Date | string): string {
  if (typeof dateOrStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrStr)) {
    const [year, month, day] = dateOrStr.split('-')
    return `${day}/${month}/${year}`
  }

  const d = typeof dateOrStr === 'string' ? new Date(dateOrStr) : dateOrStr
  return d.toLocaleDateString('pt-BR', { timeZone: TZ })
}

/**
 * Parse "YYYY-MM-DD" to a Date object.
 * Treats the date as midnight UTC to avoid timezone shift issues
 * when only comparing date parts (not times).
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/** Add hours to a Date, returns new Date */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000)
}

/** Returns { start, end } Date range for a "YYYY-MM" competência string */
export function getMonthRange(competencia: string): { start: Date; end: Date } {
  const [year, month] = competencia.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

/** Extract "YYYY-MM" competência from a Date using Brazil timezone */
export function competenciaFromDate(date: Date): string {
  return toISODateBR(date).slice(0, 7)
}

/** True if "YYYY-MM-DD" string is before today in Brazil time */
export function isBeforeToday(dateStr: string): boolean {
  return dateStr < todayBR()
}

/** True if "YYYY-MM-DD" string is after today in Brazil time */
export function isAfterToday(dateStr: string): boolean {
  return dateStr > todayBR()
}

/** Format a Date as "DD/MM/YYYY HH:mm" using Brazil timezone */
export function formatDateTimeBR(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
