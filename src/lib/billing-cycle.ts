// Billing cycle utilities for credit card statements.
// All functions are pure (no I/O). Dates as "YYYY-MM-DD" strings.
//
// Convention:
//   - Cycle opens the day after the previous closing date
//   - Cycle closes on diaFechamento of a given month
//   - Bill is due on diaVencimento of the NEXT month after closing

export type CycleStatus = 'aberta' | 'fechada' | 'vencida'

export interface BillingCycle {
  abertura: string    // YYYY-MM-DD (first day, inclusive)
  fechamento: string  // YYYY-MM-DD (closing day, inclusive)
  vencimento: string  // YYYY-MM-DD (payment due date)
  status: CycleStatus
  label: string       // "Maio 2026"
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function lastDayOf(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

function isoDate(year: number, month0: number, day: number): string {
  const d = Math.min(day, lastDayOf(year, month0))
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Returns [year, month0] after adding `delta` months
function shiftMonth(year: number, month0: number, delta: number): [number, number] {
  const total = year * 12 + month0 + delta
  return [Math.floor(total / 12), ((total % 12) + 12) % 12]
}

function cycleLabel(fechamento: string): string {
  const [y, m] = fechamento.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1))
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

function resolveStatus(fechamento: string, vencimento: string, today: string): CycleStatus {
  if (today <= fechamento) return 'aberta'
  if (today <= vencimento) return 'fechada'
  return 'vencida'
}

function buildCycle(
  fechYear: number,
  fechMonth0: number,
  diaFechamento: number,
  diaVencimento: number,
  today: string,
): BillingCycle {
  const fechamento = isoDate(fechYear, fechMonth0, diaFechamento)

  // Abertura: day after the previous month's closing date
  const [prevY, prevM0] = shiftMonth(fechYear, fechMonth0, -1)
  const prevClosingDay = Math.min(diaFechamento, lastDayOf(prevY, prevM0))
  const prevClosing = new Date(Date.UTC(prevY, prevM0, prevClosingDay))
  prevClosing.setUTCDate(prevClosing.getUTCDate() + 1)
  const abertura = prevClosing.toISOString().slice(0, 10)

  // Vencimento: diaVencimento of the month after closing
  const [ventY, ventM0] = shiftMonth(fechYear, fechMonth0, 1)
  const vencimento = isoDate(ventY, ventM0, diaVencimento)

  return {
    abertura,
    fechamento,
    vencimento,
    status: resolveStatus(fechamento, vencimento, today),
    label: cycleLabel(fechamento),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the current open billing cycle based on today's date. */
export function getCurrentCycle(
  diaFechamento: number,
  diaVencimento: number,
  today: string,
): BillingCycle {
  const [y, m, d] = today.split('-').map(Number)
  const month0 = m - 1

  // If today is on or before the closing day → cycle closes this month
  // If today is after the closing day → cycle closes next month
  const [fechY, fechM0] = d <= diaFechamento
    ? [y, month0]
    : shiftMonth(y, month0, 1)

  return buildCycle(fechY, fechM0, diaFechamento, diaVencimento, today)
}

/** Returns a specific cycle identified by its closing date string (YYYY-MM-DD). */
export function getCycleByFechamento(
  fechamentoStr: string,
  diaFechamento: number,
  diaVencimento: number,
  today: string,
): BillingCycle {
  const [y, m] = fechamentoStr.split('-').map(Number)
  return buildCycle(y, m - 1, diaFechamento, diaVencimento, today)
}

/** Returns the closing date (YYYY-MM-DD) of the cycle immediately before the given one. */
export function prevFechamento(fechamentoStr: string, diaFechamento: number): string {
  const [y, m] = fechamentoStr.split('-').map(Number)
  const [py, pm0] = shiftMonth(y, m - 1, -1)
  return isoDate(py, pm0, diaFechamento)
}

/** Returns the closing date (YYYY-MM-DD) of the cycle immediately after the given one. */
export function nextFechamento(fechamentoStr: string, diaFechamento: number): string {
  const [y, m] = fechamentoStr.split('-').map(Number)
  const [ny, nm0] = shiftMonth(y, m - 1, 1)
  return isoDate(ny, nm0, diaFechamento)
}
