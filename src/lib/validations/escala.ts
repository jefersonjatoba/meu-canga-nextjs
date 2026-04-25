import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

const tipoTurnoEnum = z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO'], {
  errorMap: () => ({ message: 'Tipo de turno inválido' }),
})

const statusEscalaEnum = z.enum(['agendada', 'realizada', 'cancelada'], {
  errorMap: () => ({ message: 'Status inválido' }),
})

// yyyy-MM-dd  (browser date input format)
const dateStringSchema = z
  .string({ required_error: 'Data é obrigatória' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')

// ─── Create ───────────────────────────────────────────────────────────────────

export const createEscalaSchema = z.object({
  dataEscala: dateStringSchema.refine((val) => {
    // Date must not be in the past (Brazil timezone aware).
    const inputDate = new Date(`${val}T00:00:00-03:00`)
    const todayBR = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    )
    todayBR.setHours(0, 0, 0, 0)
    return inputDate >= todayBR
  }, 'Não é possível agendar escala em datas passadas'),
  tipoTurno: tipoTurnoEnum,
  localServico: z.string().max(200, 'Local com máximo de 200 caracteres').optional(),
})

export type CreateEscalaSchema = z.infer<typeof createEscalaSchema>

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateEscalaSchema = z
  .object({
    dataEscala: dateStringSchema.optional(),
    tipoTurno: tipoTurnoEnum.optional(),
    localServico: z
      .string()
      .max(200, 'Local com máximo de 200 caracteres')
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
  tipoTurno: tipoTurnoEnum.or(z.literal('all')).optional(),
  localServico: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type EscalaFiltersSchema = z.infer<typeof escalaFiltersSchema>
