// Zod validation schemas for Lançamentos.
// userId must NEVER come from client body — always injected server-side from session.

import { z } from 'zod'
import { TIPOS_LANCAMENTO, STATUS_LANCAMENTO, SOURCE_LANCAMENTO } from './types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/

export const createLancamentoSchema = z.object({
  contaId:        z.string().cuid('contaId inválido'),
  descricao:      z.string().min(1, 'Descrição obrigatória').max(255, 'Descrição muito longa'),
  tipo:           z.enum(TIPOS_LANCAMENTO, { errorMap: () => ({ message: 'Tipo de lançamento inválido' }) }),
  categoria:      z.string().min(1, 'Categoria obrigatória').max(100),
  valorCentavos:  z.number({ required_error: 'Valor obrigatório' })
                   .int('Valor deve ser inteiro em centavos')
                   .positive('Valor deve ser maior que zero'),
  data:           z.string().regex(DATE_REGEX, 'Data inválida — formato: YYYY-MM-DD'),
  competenciaAt:  z.string().regex(COMPETENCIA_REGEX, 'Competência inválida — formato: YYYY-MM').optional(),
  source:         z.enum(SOURCE_LANCAMENTO).default('manual'),
  status:         z.enum(STATUS_LANCAMENTO).default('confirmada'),
  metaJson:       z.record(z.unknown()).optional(),
})

export const updateLancamentoSchema = z.object({
  descricao:      z.string().min(1).max(255).optional(),
  tipo:           z.enum(TIPOS_LANCAMENTO).optional(),
  categoria:      z.string().min(1).max(100).optional(),
  valorCentavos:  z.number().int().positive().optional(),
  data:           z.string().regex(DATE_REGEX).optional(),
  competenciaAt:  z.string().regex(COMPETENCIA_REGEX).optional(),
  status:         z.enum(STATUS_LANCAMENTO).optional(),
  metaJson:       z.record(z.unknown()).nullable().optional(),
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Ao menos um campo deve ser fornecido para atualização' },
)

export const lancamentoFiltersSchema = z.object({
  mes:       z.string().regex(COMPETENCIA_REGEX).optional(),
  tipo:      z.enum([...TIPOS_LANCAMENTO, 'all' as const]).optional(),
  contaId:   z.string().optional(),
  categoria: z.string().optional(),
  status:    z.enum([...STATUS_LANCAMENTO, 'all' as const]).optional(),
  page:      z.coerce.number().int().positive().default(1),
  pageSize:  z.coerce.number().int().positive().max(100).default(20),
})

export type CreateLancamentoSchema = z.infer<typeof createLancamentoSchema>
export type UpdateLancamentoSchema = z.infer<typeof updateLancamentoSchema>
export type LancamentoFiltersSchema = z.infer<typeof lancamentoFiltersSchema>
