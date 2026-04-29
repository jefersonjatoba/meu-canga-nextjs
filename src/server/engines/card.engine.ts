// Card Engine — pure credit-card invoice and installment rules.
// No I/O, no Prisma, no UI. Monetary values are always integer centavos.

export interface CardScheduleInput {
  dataCompra: string | Date
  diaFechamento: number
  diaVencimento: number
}

export interface InstallmentInput extends CardScheduleInput {
  valorTotalCentavos: number
  quantidadeParcelas: number
}

export interface InvoiceSchedule {
  competencia: string
  dataFechamento: string
  dataVencimento: string
}

export interface CardInstallment extends InvoiceSchedule {
  numero: number
  totalParcelas: number
  valorCentavos: number
}

/**
 * Rule adopted:
 * - The invoice closing date is the first closing day on or after purchase date.
 * - If purchase day <= diaFechamento, it belongs to the invoice closing in the
 *   purchase month. Otherwise, it belongs to the next month's invoice.
 * - The due date is after the closing date. If diaVencimento <= diaFechamento,
 *   the due date is in the following month; otherwise it is in the same month.
 * - competencia is the due date month (yyyy-MM), because that is when the card
 *   bill impacts cashflow/dashboard.
 * - Day 29/30/31 is clamped to the last valid day of the target month.
 */
export function calculateInvoiceSchedule(input: CardScheduleInput): InvoiceSchedule {
  const dataCompra = parseValidDate(input.dataCompra, 'dataCompra')
  validateCardDays(input.diaFechamento, input.diaVencimento)

  const purchaseYear = dataCompra.getUTCFullYear()
  const purchaseMonth = dataCompra.getUTCMonth()
  const purchaseDay = dataCompra.getUTCDate()
  const closingMonthOffset = purchaseDay <= input.diaFechamento ? 0 : 1

  const closingDate = createClampedUTCDate(
    purchaseYear,
    purchaseMonth + closingMonthOffset,
    input.diaFechamento,
  )

  const dueMonthOffset = input.diaVencimento <= input.diaFechamento ? 1 : 0
  const dueDate = createClampedUTCDate(
    closingDate.getUTCFullYear(),
    closingDate.getUTCMonth() + dueMonthOffset,
    input.diaVencimento,
  )

  return {
    competencia: formatCompetencia(dueDate),
    dataFechamento: formatDate(closingDate),
    dataVencimento: formatDate(dueDate),
  }
}

export function calculateClosingDate(input: CardScheduleInput): string {
  return calculateInvoiceSchedule(input).dataFechamento
}

export function calculateDueDate(input: CardScheduleInput): string {
  return calculateInvoiceSchedule(input).dataVencimento
}

export function generateInstallments(input: InstallmentInput): CardInstallment[] {
  validateInstallmentInput(input)

  const amounts = splitCentavos(input.valorTotalCentavos, input.quantidadeParcelas)
  const firstPurchaseDate = parseValidDate(input.dataCompra, 'dataCompra')

  return amounts.map((valorCentavos, index) => {
    const parcelPurchaseDate = addMonthsClamped(firstPurchaseDate, index)
    const schedule = calculateInvoiceSchedule({
      dataCompra: parcelPurchaseDate,
      diaFechamento: input.diaFechamento,
      diaVencimento: input.diaVencimento,
    })

    return {
      numero: index + 1,
      totalParcelas: input.quantidadeParcelas,
      valorCentavos,
      ...schedule,
    }
  })
}

export function splitCentavos(totalCentavos: number, parts: number): number[] {
  if (!Number.isInteger(totalCentavos) || totalCentavos <= 0) {
    throw new CardEngineError('valorTotalCentavos deve ser inteiro e maior que zero')
  }
  if (!Number.isInteger(parts) || parts < 1) {
    throw new CardEngineError('quantidadeParcelas deve ser inteiro e maior ou igual a 1')
  }

  const base = Math.floor(totalCentavos / parts)
  const remainder = totalCentavos % parts

  return Array.from({ length: parts }, (_, index) => base + (index < remainder ? 1 : 0))
}

function validateInstallmentInput(input: InstallmentInput) {
  if (!Number.isInteger(input.valorTotalCentavos) || input.valorTotalCentavos <= 0) {
    throw new CardEngineError('valorTotalCentavos deve ser inteiro e maior que zero')
  }
  if (!Number.isInteger(input.quantidadeParcelas) || input.quantidadeParcelas < 1) {
    throw new CardEngineError('quantidadeParcelas deve ser inteiro e maior ou igual a 1')
  }
  validateCardDays(input.diaFechamento, input.diaVencimento)
  parseValidDate(input.dataCompra, 'dataCompra')
}

function validateCardDays(diaFechamento: number, diaVencimento: number) {
  if (!Number.isInteger(diaFechamento) || diaFechamento < 1 || diaFechamento > 31) {
    throw new CardEngineError('diaFechamento deve estar entre 1 e 31')
  }
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) {
    throw new CardEngineError('diaVencimento deve estar entre 1 e 31')
  }
}

function parseValidDate(value: string | Date, field: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new CardEngineError(`${field} invalida`)
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new CardEngineError(`${field} deve usar formato YYYY-MM-DD`)

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new CardEngineError(`${field} invalida`)
  }

  return date
}

function createClampedUTCDate(year: number, zeroBasedMonth: number, desiredDay: number): Date {
  const lastDay = daysInMonth(year, zeroBasedMonth)
  return new Date(Date.UTC(year, zeroBasedMonth, Math.min(desiredDay, lastDay)))
}

function addMonthsClamped(date: Date, months: number): Date {
  return createClampedUTCDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    date.getUTCDate(),
  )
}

function daysInMonth(year: number, zeroBasedMonth: number): number {
  return new Date(Date.UTC(year, zeroBasedMonth + 1, 0)).getUTCDate()
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatCompetencia(date: Date): string {
  return date.toISOString().slice(0, 7)
}

export class CardEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CardEngineError'
  }
}
