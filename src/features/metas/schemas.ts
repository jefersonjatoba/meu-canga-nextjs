import { z } from 'zod'
import { TIPOS_META } from './types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

const baseMetaSchema = {
  descricao: z.string().trim().min(1, 'Descricao obrigatoria').max(120, 'Descricao muito longa'),
  tipo: z.enum(TIPOS_META, { errorMap: () => ({ message: 'Tipo de meta invalido' }) }),
  valorAlvoCentavos: z.number({ required_error: 'Valor alvo obrigatorio' })
    .int('Valor alvo deve ser inteiro em centavos')
    .positive('Valor alvo deve ser maior que zero'),
  valorInicialCentavos: z.number()
    .int('Valor inicial deve ser inteiro em centavos')
    .min(0, 'Valor inicial nao pode ser negativo')
    .optional(),
  dataInicio: z.string().regex(DATE_REGEX, 'Data de inicio invalida'),
  dataAlvo: z.string().regex(DATE_REGEX, 'Data alvo invalida').optional().nullable(),
  cor: z.string().regex(HEX_COLOR_REGEX, 'Cor deve estar em hexadecimal').optional().nullable(),
  icone: z.string().trim().max(40, 'Icone muito longo').optional().nullable(),
  ordem: z.number().int('Ordem deve ser inteira').min(0, 'Ordem nao pode ser negativa').optional(),
}

export const createMetaSchema = z.object(baseMetaSchema)
  .strict()
  .refine(
    data => !data.dataAlvo || data.dataAlvo >= data.dataInicio,
    { path: ['dataAlvo'], message: 'Data alvo deve ser posterior ao inicio' },
  )

export const updateMetaSchema = z.object({
  descricao: baseMetaSchema.descricao.optional(),
  tipo: baseMetaSchema.tipo.optional(),
  valorAlvoCentavos: baseMetaSchema.valorAlvoCentavos.optional(),
  valorInicialCentavos: baseMetaSchema.valorInicialCentavos,
  dataInicio: baseMetaSchema.dataInicio.optional(),
  dataAlvo: baseMetaSchema.dataAlvo,
  cor: baseMetaSchema.cor,
  icone: baseMetaSchema.icone,
  ordem: baseMetaSchema.ordem,
})
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser fornecido',
  })

export const registrarMetaAporteSchema = z.object({
  contaId: z.string().min(1, 'contaId invalido').max(100).optional().nullable(),
  valorCentavos: z.number({ required_error: 'Valor obrigatorio' })
    .int('Valor deve ser inteiro em centavos')
    .positive('Valor deve ser maior que zero'),
  dataAporte: z.string().regex(DATE_REGEX, 'Data do aporte invalida'),
  descricao: z.string().trim().max(120, 'Descricao muito longa').optional().nullable(),
}).strict()

export type CreateMetaSchema = z.infer<typeof createMetaSchema>
export type UpdateMetaSchema = z.infer<typeof updateMetaSchema>
export type RegistrarMetaAporteSchema = z.infer<typeof registrarMetaAporteSchema>
