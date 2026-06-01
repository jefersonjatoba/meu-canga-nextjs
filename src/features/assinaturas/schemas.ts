import { z } from 'zod'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const createAssinaturaCartaoSchema = z.object({
  contaId:      z.string().min(1, 'Conta obrigatória'),
  categoriaId:  z.string().nullable().optional(),
  descricao:    z.string().min(1, 'Descrição obrigatória').max(120),
  categoria:    z.string().min(1, 'Categoria obrigatória').max(60),
  valorCentavos: z.number().int().positive('Valor deve ser positivo'),
  diaCobranca:  z.number().int().min(1).max(31),
  dataInicio:   z.string().regex(ISO_DATE_REGEX, 'Data inválida (YYYY-MM-DD)'),
  dataFim:      z.string().regex(ISO_DATE_REGEX).nullable().optional(),
}).refine(
  data => !data.dataFim || data.dataFim >= data.dataInicio,
  { message: 'Data fim deve ser posterior ao início', path: ['dataFim'] },
)

export const updateAssinaturaCartaoSchema = z.object({
  categoriaId:  z.string().nullable().optional(),
  descricao:    z.string().min(1).max(120).optional(),
  categoria:    z.string().min(1).max(60).optional(),
  valorCentavos: z.number().int().positive().optional(),
  diaCobranca:  z.number().int().min(1).max(31).optional(),
  dataFim:      z.string().regex(ISO_DATE_REGEX).nullable().optional(),
  ativa:        z.boolean().optional(),
}).refine(
  data => Object.keys(data).length > 0,
  { message: 'Pelo menos um campo deve ser fornecido' },
)

export type CreateAssinaturaCartaoSchema = z.infer<typeof createAssinaturaCartaoSchema>
export type UpdateAssinaturaCartaoSchema = z.infer<typeof updateAssinaturaCartaoSchema>
