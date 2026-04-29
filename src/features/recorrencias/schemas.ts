import { z } from 'zod'
import { FREQUENCIAS_RECORRENCIA } from './types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIPOS_RECORRENCIA = ['income', 'expense'] as const

const baseRecorrenciaSchema = {
  contaId: z.string().min(1, 'Conta obrigatoria').max(100),
  categoriaId: z.string().min(1, 'categoriaId invalido').max(100).optional().nullable(),
  descricao: z.string().trim().min(1, 'Descricao obrigatoria').max(255, 'Descricao muito longa'),
  tipo: z.enum(TIPOS_RECORRENCIA, { errorMap: () => ({ message: 'Tipo invalido' }) }),
  categoria: z.string().trim().min(1, 'Categoria obrigatoria').max(100),
  valorCentavos: z.number({ required_error: 'Valor obrigatorio' })
    .int('Valor deve ser inteiro em centavos')
    .positive('Valor deve ser maior que zero'),
  frequencia: z.enum(FREQUENCIAS_RECORRENCIA, {
    errorMap: () => ({ message: 'Frequencia invalida' }),
  }),
  diaVencimento: z.number()
    .int('Dia deve ser inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  dataInicio: z.string().regex(DATE_REGEX, 'Data de inicio invalida'),
  dataFim: z.string().regex(DATE_REGEX, 'Data fim invalida').optional().nullable(),
}

export const createRecorrenciaSchema = z.object(baseRecorrenciaSchema)
  .strict()
  .refine(
    data => !data.dataFim || data.dataFim >= data.dataInicio,
    { path: ['dataFim'], message: 'Data fim deve ser posterior ao inicio' },
  )

export const updateRecorrenciaSchema = z.object({
  contaId: baseRecorrenciaSchema.contaId.optional(),
  categoriaId: baseRecorrenciaSchema.categoriaId,
  descricao: baseRecorrenciaSchema.descricao.optional(),
  tipo: baseRecorrenciaSchema.tipo.optional(),
  categoria: baseRecorrenciaSchema.categoria.optional(),
  valorCentavos: baseRecorrenciaSchema.valorCentavos.optional(),
  frequencia: baseRecorrenciaSchema.frequencia.optional(),
  diaVencimento: baseRecorrenciaSchema.diaVencimento.optional(),
  dataInicio: baseRecorrenciaSchema.dataInicio.optional(),
  dataFim: baseRecorrenciaSchema.dataFim,
  ativa: z.boolean().optional(),
})
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser fornecido',
  })

export type CreateRecorrenciaSchema = z.infer<typeof createRecorrenciaSchema>
export type UpdateRecorrenciaSchema = z.infer<typeof updateRecorrenciaSchema>
