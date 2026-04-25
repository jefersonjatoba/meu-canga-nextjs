// ─── RAS Calculation Functions ────────────────────────────────────────────────
// Pure business-logic helpers — no database access required.

import type { RasAgendamento, RasAgenda } from '@/types/ras'
import {
  RAS_MAX_MONTHLY_HOURS,
  RAS_WARNING_THRESHOLD,
  RAS_MIN_REST_HOURS,
  RAS_REALIZE_WINDOW_HOURS,
} from '@/types/ras'

// ─── Monthly hours aggregation ────────────────────────────────────────────────

/**
 * Sums the total hours from all RasAgendamento records that belong to the
 * given month/year competência (format: "YYYY-MM").
 *
 * Each agendamento's duration comes from its parent RasAgenda (rasAgenda.duracao).
 * Only non-cancelled agendamentos are counted.
 */
export function calculateRasMonthlyHours(
  rasAgendamentos: RasAgendamento[],
  mes: number, // 1-based
  ano: number
): number {
  const competencia = `${ano}-${String(mes).padStart(2, '0')}`

  return rasAgendamentos
    .filter(
      (a) =>
        a.rasAgenda?.competencia === competencia &&
        a.status !== 'cancelado'
    )
    .reduce((sum, a) => sum + (a.rasAgenda?.duracao ?? 0), 0)
}

// ─── Warning level ────────────────────────────────────────────────────────────

/**
 * Returns a warning level based on total hours scheduled for the month.
 *
 * normal   → < 96h   (below 80% of 120h cap)
 * warning  → 96–119h
 * critical → >= 120h (monthly limit reached)
 */
export function calculateRasWarningLevel(
  totalHoras: number
): 'normal' | 'warning' | 'critical' {
  if (totalHoras >= RAS_MAX_MONTHLY_HOURS) return 'critical'
  if (totalHoras >= RAS_WARNING_THRESHOLD) return 'warning'
  return 'normal'
}

// ─── Can schedule check ───────────────────────────────────────────────────────

/**
 * Returns true if adding `newDuracao` hours to the current `existingHours`
 * would NOT exceed the 120h monthly cap.
 */
export function canScheduleRas(
  existingHours: number,
  newDuracao: number
): boolean {
  return existingHours + newDuracao <= RAS_MAX_MONTHLY_HOURS
}

// ─── Rest requirement between two RAS events ─────────────────────────────────

/**
 * Calculates the gap (in hours) between two consecutive RAS events and
 * validates it meets the minimum 8-hour rest requirement.
 *
 * `ras1` is assumed to precede `ras2` in time.  Times are derived from
 * the `data` + `horaFim` of ras1 and `data` + `horaInicio` of ras2.
 */
export function calculateRestRequirementsBetween(
  ras1: RasAgenda,
  ras2: RasAgenda
): { hoursGap: number; valid: boolean } {
  // Build full Date objects from date + time strings
  const end1 = parseDatetime(ras1.data, ras1.horaFim)
  const start2 = parseDatetime(ras2.data, ras2.horaInicio)

  const msGap = start2.getTime() - end1.getTime()
  const hoursGap = msGap / 3_600_000

  return {
    hoursGap,
    valid: hoursGap >= RAS_MIN_REST_HOURS,
  }
}

/** Internal helper – combines a yyyy-MM-dd date string and HH:mm time string
 *  into a Date (UTC, since we only compare deltas). */
function parseDatetime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour, minute))
}

// ─── Confirmation window check ────────────────────────────────────────────────

/**
 * Returns true if `dataAtual` is within the 72-hour confirmation window
 * that opens after the RAS event date (`dataRas`).
 *
 * The window runs from midnight at the start of `dataRas` (Brazil time)
 * until 72 hours later.
 */
export function isWithinConfirmationWindow(
  dataRas: Date,
  dataAtual: Date
): boolean {
  // Normalise RAS date to midnight Brazil time
  const rasDateBR = toBrazilMidnight(dataRas)
  const windowEnd = new Date(
    rasDateBR.getTime() + RAS_REALIZE_WINDOW_HOURS * 3_600_000
  )
  const now = dataAtual.getTime()

  return now >= rasDateBR.getTime() && now <= windowEnd.getTime()
}

/** Returns a Date representing midnight (UTC) for the Brazil-timezone wall
 *  clock date of the given UTC Date. */
function toBrazilMidnight(date: Date): Date {
  const brString = date.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const [month, day, year] = brString.split('/').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}
