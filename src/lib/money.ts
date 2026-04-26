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
 */
export function toCents(value: number | string): number {
  if (typeof value === 'number') {
    if (!isFinite(value)) throw new Error(`toCents: invalid number ${value}`)
    return Math.round(value * 100)
  }
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  if (!isFinite(parsed)) throw new Error(`toCents: cannot parse "${value}"`)
  return Math.round(parsed * 100)
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
