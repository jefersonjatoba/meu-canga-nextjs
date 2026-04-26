import { z } from 'zod'
import {
  RAS_PRICE_TABLE,
  RAS_ALL_LOCALS,
  RAS_MAX_MONTHLY_HOURS,
} from '@/types/ras'

// ─── Shared primitives ────────────────────────────────────────────────────────

const graduacaoEnum = z.enum(['SD/CB', 'SGT/SUBTEN'], {
  errorMap: () => ({ message: 'Graduação inválida' }),
})

const duracaoEnum = z.union(
  [z.literal(6), z.literal(8), z.literal(12), z.literal(24)],
  { errorMap: () => ({ message: 'Duração deve ser 6, 8, 12 ou 24 horas' }) }
)

const statusRasEnum = z.enum(
  ['agendado', 'realizado', 'pendente', 'confirmado', 'cancelado'],
  { errorMap: () => ({ message: 'Status inválido' }) }
)

// yyyy-MM-dd
const dateStringSchema = z
  .string({ required_error: 'Data é obrigatória' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')

// HH:mm
const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM')

// yyyy-MM
const competenciaSchema = z
  .string({ required_error: 'Competência é obrigatória' })
  .regex(/^\d{4}-\d{2}$/, 'Competência deve estar no formato AAAA-MM')

// Validate that (graduacao, duracao) is a known entry in the price table
const graduacaoDuracaoRefine = (
  data: { graduacao: string; duracao: number },
  ctx: z.RefinementCtx
) => {
  const table = RAS_PRICE_TABLE as Record<string, Record<number, number>>
  if (!table[data.graduacao]?.[data.duracao]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Combinação de graduação "${data.graduacao}" e duração "${data.duracao}h" não encontrada na tabela de preços`,
      path: ['duracao'],
    })
  }
}

// Validate location against the combined locals list
const localRefine = (local: string, ctx: z.RefinementCtx) => {
  if (!RAS_ALL_LOCALS.includes(local)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Local "${local}" não é uma unidade válida`,
      path: ['local'],
    })
  }
}

const tipoRasEnum = z.enum(['voluntario', 'compulsorio'], {
  errorMap: () => ({ message: 'Tipo deve ser voluntario ou compulsorio' }),
})

const tipoVagaRasEnum = z.enum(['titular', 'reserva'], {
  errorMap: () => ({ message: 'Tipo de vaga deve ser titular ou reserva' }),
})

// ─── Create RasAgenda ─────────────────────────────────────────────────────────

export const createRasAgendaSchema = z
  .object({
    data: dateStringSchema,
    horaInicio: timeStringSchema,
    horaFim: timeStringSchema,
    duracao: duracaoEnum,
    local: z.string({ required_error: 'Local é obrigatório' }),
    graduacao: graduacaoEnum,
    tipo: tipoRasEnum.default('voluntario'),
    tipoVaga: tipoVagaRasEnum.default('titular'),
    competencia: competenciaSchema,
    observacoes: z
      .string()
      .max(500, 'Observações com máximo de 500 caracteres')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Price table check
    graduacaoDuracaoRefine(data, ctx)

    // Location check
    localRefine(data.local, ctx)

    // horaFim must not precede horaInicio
    if (data.horaFim < data.horaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Horário de término deve ser posterior ao horário de início',
        path: ['horaFim'],
      })
    }

    // competencia must match the month of data
    const [year, month] = data.data.split('-')
    if (data.competencia !== `${year}-${month}`) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Competência deve corresponder ao mês da data do RAS',
        path: ['competencia'],
      })
    }
  })

export type CreateRasAgendaSchema = z.infer<typeof createRasAgendaSchema>

// ─── Update RasAgenda ─────────────────────────────────────────────────────────

export const updateRasAgendaSchema = z
  .object({
    data: dateStringSchema.optional(),
    horaInicio: timeStringSchema.optional(),
    horaFim: timeStringSchema.optional(),
    duracao: duracaoEnum.optional(),
    local: z.string().optional(),
    graduacao: graduacaoEnum.optional(),
    tipo: tipoRasEnum.optional(),
    tipoVaga: tipoVagaRasEnum.optional(),
    competencia: competenciaSchema.optional(),
    status: statusRasEnum.optional(),
    observacoes: z
      .string()
      .max(500, 'Observações com máximo de 500 caracteres')
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  })
  .superRefine((data, ctx) => {
    // Only validate price table when both fields are present
    if (data.graduacao !== undefined && data.duracao !== undefined) {
      graduacaoDuracaoRefine(
        { graduacao: data.graduacao, duracao: data.duracao },
        ctx
      )
    }

    // Location check when provided
    if (data.local !== undefined) {
      localRefine(data.local, ctx)
    }

    // Time order when both provided
    if (data.horaInicio !== undefined && data.horaFim !== undefined) {
      if (data.horaFim < data.horaInicio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Horário de término deve ser posterior ao horário de início',
          path: ['horaFim'],
        })
      }
    }
  })

export type UpdateRasAgendaSchema = z.infer<typeof updateRasAgendaSchema>

// ─── Mark as realized ────────────────────────────────────────────────────────

export const realizarRasSchema = z.object({
  dataRealizacao: z
    .string()
    .datetime({ message: 'Data de realização deve ser um datetime ISO válido' }),
  observacoes: z
    .string()
    .max(500, 'Observações com máximo de 500 caracteres')
    .optional(),
})

export type RealizarRasSchema = z.infer<typeof realizarRasSchema>

// ─── Query filters ────────────────────────────────────────────────────────────

export const rasAgendaFiltersSchema = z.object({
  competencia: competenciaSchema.optional(),
  status: statusRasEnum.or(z.literal('all')).optional(),
  graduacao: graduacaoEnum.or(z.literal('all')).optional(),
  local: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type RasAgendaFiltersSchema = z.infer<typeof rasAgendaFiltersSchema>

// ─── Monthly hours check (service-layer helper) ───────────────────────────────

/**
 * Validates that adding `newHours` to `currentMonthHours` does not exceed the
 * monthly cap (RAS_MAX_MONTHLY_HOURS = 120h).
 * Returns an error message string or null when valid.
 */
export function validateMonthlyHours(
  currentMonthHours: number,
  newHours: number
): string | null {
  const projected = currentMonthHours + newHours
  if (projected > RAS_MAX_MONTHLY_HOURS) {
    const remaining = RAS_MAX_MONTHLY_HOURS - currentMonthHours
    return (
      `Limite mensal de ${RAS_MAX_MONTHLY_HOURS}h seria excedido. ` +
      `Horas disponíveis: ${remaining}h. Solicitado: ${newHours}h.`
    )
  }
  return null
}

// ─── RasCenarioSalvo ─────────────────────────────────────────────────────────

const rasCenarioEventoSchema = z.object({
  data: dateStringSchema,
  local: z.string().min(1, 'Local é obrigatório'),
  duracao: duracaoEnum,
})

export const createRasCenarioSchema = z
  .object({
    nome: z
      .string({ required_error: 'Nome do cenário é obrigatório' })
      .min(1)
      .max(100, 'Nome com máximo de 100 caracteres'),
    descricao: z
      .string()
      .max(300, 'Descrição com máximo de 300 caracteres')
      .optional(),
    mes: competenciaSchema,
    graduacao: graduacaoEnum,
    eventos: z
      .array(rasCenarioEventoSchema)
      .min(1, 'Adicione ao menos um evento ao cenário'),
  })
  .superRefine((data, ctx) => {
    // Total hours must not exceed monthly cap
    const totalHoras = data.eventos.reduce((sum, e) => sum + e.duracao, 0)
    if (totalHoras > RAS_MAX_MONTHLY_HOURS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total de horas do cenário (${totalHoras}h) excede o limite de ${RAS_MAX_MONTHLY_HOURS}h/mês`,
        path: ['eventos'],
      })
    }

    // All event locations must be valid
    data.eventos.forEach((evento, index) => {
      if (!RAS_ALL_LOCALS.includes(evento.local)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Local "${evento.local}" inválido no evento ${index + 1}`,
          path: ['eventos', index, 'local'],
        })
      }
    })
  })

export type CreateRasCenarioSchema = z.infer<typeof createRasCenarioSchema>

// ─── Time validation helpers ──────────────────────────────────────────────

/**
 * Validates that a time string is in HH:mm format.
 * Returns true if valid, false otherwise.
 */
export function isValidTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time)
}

/**
 * Validates that a date string is in yyyy-MM-dd format.
 * Returns true if valid, false otherwise.
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

/**
 * Validates that a competencia string is in yyyy-MM format.
 * Returns true if valid, false otherwise.
 */
export function isValidCompetenciaFormat(competencia: string): boolean {
  return /^\d{4}-\d{2}$/.test(competencia)
}

/**
 * Calculates duration in hours between two time strings.
 * Returns hours, assuming times are on the same day.
 */
export function calculateDurationHours(
  horaInicio: string,
  horaFim: string
): number {
  const [startH, startM] = horaInicio.split(':').map(Number)
  const [endH, endM] = horaFim.split(':').map(Number)

  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (endMinutes <= startMinutes) {
    // Time spans midnight (e.g. 22:00 to 06:00)
    return (24 * 60 - startMinutes + endMinutes) / 60
  }

  return (endMinutes - startMinutes) / 60
}

/**
 * Extracts year and month from a date string (yyyy-MM-dd).
 * Returns { year: string, month: string }.
 */
export function extractCompetencia(dateString: string): {
  year: string
  month: string
} {
  const [year, month] = dateString.split('-')
  return { year, month }
}
