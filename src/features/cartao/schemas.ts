import { z } from 'zod'
import { STATUS_FATURA_CARTAO } from './types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/

export const createCompraCartaoSchema = z.object({
  contaId: z.string().min(1, 'contaId obrigatorio').max(100),
  descricao: z.string().trim().min(1, 'Descricao obrigatoria').max(255, 'Descricao muito longa'),
  categoriaId: z.string().min(1, 'categoriaId invalido').max(100).optional().nullable(),
  categoria: z.string().trim().min(1, 'Categoria obrigatoria').max(100),
  valorTotalCentavos: z.number({ required_error: 'Valor obrigatorio' })
    .int('Valor deve ser inteiro em centavos')
    .positive('Valor deve ser maior que zero'),
  dataCompra: z.string().regex(DATE_REGEX, 'Data invalida - formato: YYYY-MM-DD'),
  quantidadeParcelas: z.number()
    .int('Quantidade de parcelas deve ser inteira')
    .min(1, 'Quantidade de parcelas deve ser maior ou igual a 1')
    .max(360, 'Quantidade de parcelas muito alta'),
}).strict()

export const faturaCartaoFiltersSchema = z.object({
  contaId: z.string().min(1).max(100).optional(),
  status: z.enum(STATUS_FATURA_CARTAO).optional(),
  competencia: z.string().regex(COMPETENCIA_REGEX, 'Competencia invalida - formato: YYYY-MM').optional(),
}).strict()

export const pagarFaturaSchema = z.object({
  faturaCartaoId: z.string().min(1, 'faturaCartaoId obrigatorio').max(100),
  contaPagamentoId: z.string().min(1, 'contaPagamentoId obrigatorio').max(100),
  valorCentavos: z.number({ required_error: 'Valor obrigatorio' })
    .int('Valor deve ser inteiro em centavos')
    .positive('Valor deve ser maior que zero'),
  dataPagamento: z.string().regex(DATE_REGEX, 'Data invalida - formato: YYYY-MM-DD'),
}).strict()

export type CreateCompraCartaoSchema = z.infer<typeof createCompraCartaoSchema>
export type FaturaCartaoFiltersSchema = z.infer<typeof faturaCartaoFiltersSchema>
export type PagarFaturaSchema = z.infer<typeof pagarFaturaSchema>
