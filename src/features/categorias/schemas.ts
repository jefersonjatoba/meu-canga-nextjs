import { z } from 'zod'
import { TIPOS_CATEGORIA } from './types'

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor invalida')

export const createCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatorio').max(100, 'Nome muito longo'),
  tipo: z.enum(TIPOS_CATEGORIA, { errorMap: () => ({ message: 'Tipo de categoria invalido' }) }),
  icone: z.string().trim().max(20, 'Icone muito longo').optional().nullable(),
  cor: hexColorSchema.optional().nullable(),
  ordem: z.number().int().min(0).max(9999).optional(),
}).strict()

export const updateCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatorio').max(100, 'Nome muito longo').optional(),
  tipo: z.enum(TIPOS_CATEGORIA).optional(),
  icone: z.string().trim().max(20, 'Icone muito longo').optional().nullable(),
  cor: hexColorSchema.optional().nullable(),
  ativa: z.boolean().optional(),
  ordem: z.number().int().min(0).max(9999).optional(),
}).strict().refine(
  data => Object.keys(data).length > 0,
  { message: 'Ao menos um campo deve ser fornecido' },
)

export const categoriaFiltersSchema = z.object({
  tipo: z.enum(TIPOS_CATEGORIA).optional(),
  includeInactive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform(value => value === true || value === 'true' || value === '1'),
})

export type CreateCategoriaSchema = z.infer<typeof createCategoriaSchema>
export type UpdateCategoriaSchema = z.infer<typeof updateCategoriaSchema>
export type CategoriaFiltersSchema = z.infer<typeof categoriaFiltersSchema>
