// Monetary helpers — all amounts stored as centavos (Int).
// Never use Float arithmetic for money. Never call parseFloat() on BRL values.

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Format centavos as "R$ 1.234,56" */
export function formatBRL(centavos: number): string {
  return BRL.format(centavos / 100)
}

/**
 * Convert a decimal number or BRL string to centavos (Int).
 * Accepts: 783.21, "783,21", "R$ 1.234,56", "1.234,56"
 *
 * Uses integer string parsing to avoid floating point errors.
 * "1234.56" → split at "." → 1234 * 100 + 56 = 123456 (exact)
 */
export function toCents(value: number | string): number {
  // Normalise to a dot-decimal string, strip currency symbols and thousand separators
  const str = typeof value === 'number'
    ? value.toString()
    : value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')

  if (!str || str === '-') throw new Error(`toCents: cannot parse "${value}"`)

  const dotIndex = str.indexOf('.')
  if (dotIndex === -1) {
    const n = parseInt(str, 10)
    if (!isFinite(n)) throw new Error(`toCents: cannot parse "${value}"`)
    return n * 100
  }

  const intPart  = parseInt(str.slice(0, dotIndex) || '0', 10)
  const decStr   = str.slice(dotIndex + 1).padEnd(2, '0').slice(0, 2)
  const decPart  = parseInt(decStr, 10)

  if (!isFinite(intPart) || !isFinite(decPart)) throw new Error(`toCents: cannot parse "${value}"`)
  return (intPart < 0 ? -1 : 1) * (Math.abs(intPart) * 100 + decPart)
}

/** Convert centavos to decimal number (use only for display/calculation output) */
export function fromCents(centavos: number): number {
  return centavos / 100
}

/** Sum an array of centavos values */
export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

/** Clamp centavos to >= 0 */
export function positiveCents(centavos: number): number {
  return Math.max(0, centavos)
}
