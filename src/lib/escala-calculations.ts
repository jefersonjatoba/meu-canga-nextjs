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

// ─── Shift progress (v1-compatible) ──────────────────────────────────────────

/**
 * Calcula o progresso real de um plantão específico com base na hora atual.
 * Idêntico à função calcularProgressoEscala do MeuCanga_v1.
 *
 * @param dataStr     - data do plantão "YYYY-MM-DD"
 * @param horaInicio  - hora de início "HH:mm"
 * @param tipoConfig  - tipo do ciclo configurado ex: "12x24-12x72"
 *                      o primeiro número indica duração em horas do turno
 * @returns { pct: 0-100, status: 'futuro' | 'em_progresso' | 'concluido' }
 */
export function calcularProgressoPlantao(
  dataStr: string,
  horaInicio: string,
  tipoConfig: string
): { pct: number; status: 'futuro' | 'em_progresso' | 'concluido' } {
  try {
    // Hora atual em São Paulo
    const agoraLocal = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    )
    const hojeStr = agoraLocal.toISOString().slice(0, 10)

    // Data no passado → concluído
    if (dataStr < hojeStr) {
      return { pct: 100, status: 'concluido' }
    }

    // Extrair duração em horas do tipo (ex: "12x24-12x72" → 12)
    const duracaoHoras = parseInt(tipoConfig.split('x')[0])
    const duracao = isNaN(duracaoHoras) ? 24 : duracaoHoras

    // Timestamps com offset de São Paulo (-03:00)
    const inicioDateTime = new Date(`${dataStr}T${horaInicio}:00-03:00`)
    const fimDateTime = new Date(inicioDateTime.getTime() + duracao * 3_600_000)

    const agora = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    )

    if (agora < inicioDateTime) {
      return { pct: 0, status: 'futuro' }
    }
    if (agora >= fimDateTime) {
      return { pct: 100, status: 'concluido' }
    }

    // Em progresso: calcular %
    const totalMs = fimDateTime.getTime() - inicioDateTime.getTime()
    const decorridos = agora.getTime() - inicioDateTime.getTime()
    const pct = Math.round((decorridos / totalMs) * 100)

    return { pct: Math.min(pct, 99), status: 'em_progresso' }
  } catch {
    return { pct: 0, status: 'futuro' }
  }
}

/**
 * @deprecated Use calcularProgressoPlantao instead.
 * Kept for backwards-compat. Returns cycle position as 0–100.
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
  const posInCycle = ((df % cycleLen) + cycleLen) % cycleLen
  return Math.round((posInCycle / cycleLen) * 100)
}
