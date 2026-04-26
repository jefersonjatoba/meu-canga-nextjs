// Date helpers — timezone-aware for America/Sao_Paulo.
// Always use these instead of raw Date operations when dealing with BR dates.

const TZ = 'America/Sao_Paulo'

/** Today's date in Brazil as "YYYY-MM-DD" */
export function todayBR(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TZ })
}

/** Current month in Brazil as "YYYY-MM" */
export function currentMonthBR(): string {
  return todayBR().slice(0, 7)
}

/** Convert a Date to "YYYY-MM-DD" using Brazil timezone */
export function toISODateBR(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: TZ })
}

/** Format a date or ISO string as "DD/MM/YYYY" for display */
export function formatDateBR(dateOrStr: Date | string): string {
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
