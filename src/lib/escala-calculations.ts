// ─── Escala Cycle Calculation Functions ──────────────────────────────────────
// Pure arithmetic helpers — no database access required.
// All dates are interpreted in the America/Sao_Paulo timezone.

import type { TipoCiclo } from '@/types/escala'
import { isWorkDay } from '@/types/escala'

// ─── Timezone helper ──────────────────────────────────────────────────────────

/**
 * Returns a Date object normalised to midnight in America/Sao_Paulo for the
 * given UTC Date.  We use the "en-US" locale trick to get Sao Paulo wall-clock
 * values without a full ICU library.
 */
function toBrazilMidnight(date: Date): Date {
  const brString = date.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  // brString is like "04/25/2026"
  const [month, day, year] = brString.split('/').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Returns the number of whole days elapsed from `start` to `target`, both
 * treated as Brazil-timezone midnight dates.
 */
function daysDiff(start: Date, target: Date): number {
  const startMid = toBrazilMidnight(start).getTime()
  const targetMid = toBrazilMidnight(target).getTime()
  return Math.round((targetMid - startMid) / 86_400_000)
}

// ─── ISO week number helper ───────────────────────────────────────────────────

/**
 * Returns the ISO 8601 week number (1-53) for the given date.
 * Week 1 is the week containing the first Thursday of the year.
 */
export function isoWeekNumber(date: Date): number {
  const d = toBrazilMidnight(date)
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1)
  const dayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay() // 1=Mon, 7=Sun
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

// ─── Core: calculate work days in a given month ───────────────────────────────

/**
 * Returns an array of day-of-month numbers (1–31) on which the employee works
 * in the given month/year, based on their cycle type and cycle start date.
 *
 * For 12x36-folgao the cycle reference date (`dataInicio`) should be a Monday
 * of a "Week A" (even fortnight).  The implementation uses ISO week parity as
 * described in the old project's logic.
 */
export function calculateCycleDays(
  tipoCiclo: TipoCiclo,
  dataInicio: Date,
  ano: number,
  mes: number // 1-based
): number[] {
  const daysInMonth = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  const workDays: number[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(ano, mes - 1, day))
    const df = daysDiff(dataInicio, date)

    if (tipoCiclo === '12x36-folgao') {
      // Use ISO-week parity: even ISO week → Week A (Mon/Wed/Fri)
      //                       odd ISO week  → Week B (Tue/Thu/Sat)
      const isoWeek = isoWeekNumber(date)
      const brDate = toBrazilMidnight(date)
      const utcDow = brDate.getUTCDay() // 0=Sun, 1=Mon … 6=Sat

      if (isoWeek % 2 === 0) {
        // Week A: Mon(1), Wed(3), Fri(5)
        if (utcDow === 1 || utcDow === 3 || utcDow === 5) {
          workDays.push(day)
        }
      } else {
        // Week B: Tue(2), Thu(4), Sat(6)
        if (utcDow === 2 || utcDow === 4 || utcDow === 6) {
          workDays.push(day)
        }
      }
    } else {
      if (isWorkDay(tipoCiclo, df)) {
        workDays.push(day)
      }
    }
  }

  return workDays
}

// ─── Quick single-date check ──────────────────────────────────────────────────

/**
 * Returns 'work' or 'off' for a specific date without any database access.
 */
export function calculateCycleDayOfWeek(
  tipoCiclo: TipoCiclo,
  dataInicio: Date,
  data: Date
): 'work' | 'off' {
  if (tipoCiclo === '12x36-folgao') {
    const isoWeek = isoWeekNumber(data)
    const brDate = toBrazilMidnight(data)
    const utcDow = brDate.getUTCDay()

    const isWork =
      isoWeek % 2 === 0
        ? utcDow === 1 || utcDow === 3 || utcDow === 5
        : utcDow === 2 || utcDow === 4 || utcDow === 6

    return isWork ? 'work' : 'off'
  }

  const df = daysDiff(dataInicio, data)
  return isWorkDay(tipoCiclo, df) ? 'work' : 'off'
}

// ─── Shift progress percentage ────────────────────────────────────────────────

/**
 * Returns 0-100 representing how far through the current shift cycle we are.
 *
 * Example: 12x24-12x72 has a 5-day cycle.  On day 3 of the cycle → 60%.
 */
export function calculateShiftProgress(
  tipoCiclo: TipoCiclo,
  dataInicio: Date,
  dataAtual: Date
): number {
  const cycleLengths: Record<TipoCiclo, number> = {
    '12x24-12x72': 5,
    '12x24-12x48': 4,
    '24x48': 3,
    '24x72': 4,
    '12x36-folgao': 14,
  }

  const cycleLen = cycleLengths[tipoCiclo]
  const df = daysDiff(dataInicio, dataAtual)

  // Position within the current cycle (0-based, always positive via modulo)
  const posInCycle = ((df % cycleLen) + cycleLen) % cycleLen

  return Math.round((posInCycle / cycleLen) * 100)
}
