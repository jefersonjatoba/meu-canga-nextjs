import { z } from 'zod'
import { TIPOS_CONTA } from './types'

const COR_REGEX = /^#[0-9a-fA-F]{6}$/

export const createContaSchema = z.object({
  nome:          z.string().min(1, 'Nome obrigatório').max(100, 'Nome muito longo'),
  tipo:          z.enum(TIPOS_CONTA as [string, ...string[]] as ['checking', ...string[]], {
    errorMap: () => ({ message: 'Tipo de conta inválido' }),
  }),
  banco:         z.string().max(100, 'Banco muito longo').optional(),
  cor:           z.string().regex(COR_REGEX, 'Cor inválida — use formato #RRGGBB').optional(),
  saldoCentavos: z.number().int('Saldo deve ser inteiro em centavos').default(0),
})

export const updateContaSchema = z.object({
  nome:  z.string().min(1).max(100).optional(),
  tipo:  z.enum(TIPOS_CONTA as ['checking', ...string[]]).optional(),
  banco: z.string().max(100).optional().nullable(),
  cor:   z.string().regex(COR_REGEX).optional().nullable(),
  ativa: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo deve ser fornecido' })

export type CreateContaSchema = z.infer<typeof createContaSchema>
export type UpdateContaSchema = z.infer<typeof updateContaSchema>
