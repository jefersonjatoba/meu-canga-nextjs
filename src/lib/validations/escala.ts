import { z } from 'zod'
import { DEFAULT_HORA_INICIO, DEFAULT_HORA_FIM } from '@/types/escala'

// ─── Shared primitives ────────────────────────────────────────────────────────

const tipoPlantaoEnum = z.enum(
  ['plantao', 'sobreaviso', 'extra', 'folga', 'ferias'],
  { errorMap: () => ({ message: 'Tipo de plantão inválido' }) }
)

const tipoCicloEnum = z.enum(
  ['12x24-12x72', '12x24-12x48', '24x48', '24x72', '12x36-folgao'],
  { errorMap: () => ({ message: 'Tipo de ciclo inválido' }) }
)

const statusEscalaEnum = z.enum(['agendada', 'realizada', 'cancelada'], {
  errorMap: () => ({ message: 'Status inválido' }),
})

// yyyy-MM-dd  (browser date input format)
const dateStringSchema = z
  .string({ required_error: 'Data é obrigatória' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')

// HH:mm
const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM')

// ─── Create ───────────────────────────────────────────────────────────────────

export const createEscalaSchema = z
  .object({
    dataEscala: dateStringSchema.refine((val) => {
      const inputDate = new Date(`${val}T00:00:00-03:00`)
      const todayBR = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
      )
      todayBR.setHours(0, 0, 0, 0)
      return inputDate >= todayBR
    }, 'Não é possível agendar escala em datas passadas'),
    tipoPlantao: tipoPlantaoEnum,
    tipoCiclo: tipoCicloEnum.optional(),
    horaInicio: timeStringSchema.default(DEFAULT_HORA_INICIO),
    horaFim: timeStringSchema.default(DEFAULT_HORA_FIM),
    localServico: z
      .string()
      .max(200, 'Local com máximo de 200 caracteres')
      .optional(),
    observacoes: z
      .string()
      .max(500, 'Observações com máximo de 500 caracteres')
      .optional(),
  })
  .refine(
    (data) => {
      // horaFim must be after horaInicio (same day; 24h shifts are still valid when
      // horaFim === horaInicio or when tipoPlantao is folga/ferias)
      if (data.tipoPlantao === 'folga' || data.tipoPlantao === 'ferias') {
        return true
      }
      return data.horaFim >= data.horaInicio
    },
    {
      message: 'Horário de término deve ser posterior ao horário de início',
      path: ['horaFim'],
    }
  )

export type CreateEscalaSchema = z.infer<typeof createEscalaSchema>

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateEscalaSchema = z
  .object({
    dataEscala: dateStringSchema.optional(),
    tipoPlantao: tipoPlantaoEnum.optional(),
    tipoCiclo: tipoCicloEnum.nullable().optional(),
    horaInicio: timeStringSchema.optional(),
    horaFim: timeStringSchema.optional(),
    localServico: z
      .string()
      .max(200, 'Local com máximo de 200 caracteres')
      .nullable()
      .optional(),
    observacoes: z
      .string()
      .max(500, 'Observações com máximo de 500 caracteres')
      .nullable()
      .optional(),
    status: statusEscalaEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  })

export type UpdateEscalaSchema = z.infer<typeof updateEscalaSchema>

// ─── Query filters ────────────────────────────────────────────────────────────

export const escalaFiltersSchema = z.object({
  mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato AAAA-MM')
    .optional(),
  status: statusEscalaEnum.or(z.literal('all')).optional(),
  tipoPlantao: tipoPlantaoEnum.or(z.literal('all')).optional(),
  tipoCiclo: tipoCicloEnum.or(z.literal('all')).optional(),
  localServico: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type EscalaFiltersSchema = z.infer<typeof escalaFiltersSchema>

// ─── Helper functions for validation ──────────────────────────────────────

/**
 * Validates that a time string is in HH:mm format.
 */
export function isValidTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time)
}

/**
 * Validates that a date string is in yyyy-MM-dd format.
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

/**
 * Validates that month string is in yyyy-MM format.
 */
export function isValidMonthFormat(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month)
}

/**
 * Calculates hours worked between two times.
 * Assumes times are on the same day unless explicitly configured.
 */
export function calculateHoursWorked(
  horaInicio: string,
  horaFim: string
): number {
  const [startH, startM] = horaInicio.split(':').map(Number)
  const [endH, endM] = horaFim.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (endMinutes < startMinutes) {
    // Time spans midnight (e.g. 22:00 to 06:00)
    return (24 * 60 - startMinutes + endMinutes) / 60
  }

  return (endMinutes - startMinutes) / 60
}

/**
 * Checks if a date is in the past (Brazilian timezone).
 */
export function isDateInPast(dateString: string): boolean {
  const inputDate = new Date(`${dateString}T00:00:00-03:00`)
  const todayBR = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
  todayBR.setHours(0, 0, 0, 0)
  return inputDate < todayBR
}

/**
 * Extracts year and month from a date string (yyyy-MM-dd).
 */
export function extractMonthFromDate(dateString: string): string {
  const [year, month] = dateString.split('-')
  return `${year}-${month}`
}
