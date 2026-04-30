import { z } from 'zod'

import { TIPOS_OPERACAO_INVESTIMENTO } from './types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const QUANTIDADE_DECIMAL_REGEX = /^\d+(?:[.,]\d{1,8})?$/

const idSchema = z.string().trim().min(1, 'Id obrigatorio').max(100, 'Id invalido')
const optionalContaIdSchema = z.string().trim().min(1, 'contaId invalido').max(100).optional().nullable()

const quantidadeDecimalSchema = z.string()
  .trim()
  .regex(QUANTIDADE_DECIMAL_REGEX, 'Quantidade decimal invalida')
  .refine(isPositiveQuantityDecimal, 'Quantidade deve ser maior que zero')

const centavosPositivosSchema = (field: string) => z.number({ required_error: `${field} obrigatorio` })
  .int(`${field} deve ser inteiro em centavos`)
  .positive(`${field} deve ser maior que zero`)

export const criarAtivoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatorio').max(120, 'Nome muito longo'),
  ticker: z.string().trim().min(1, 'Ticker obrigatorio').max(24, 'Ticker muito longo'),
  tipo: z.string().trim().min(1, 'Tipo obrigatorio').max(40, 'Tipo muito longo'),
  moeda: z.string().trim().min(1, 'Moeda obrigatoria').max(12, 'Moeda muito longa'),
  corretora: z.string().trim().min(1, 'Corretora invalida').max(80, 'Corretora muito longa').optional().nullable(),
}).strict()

export const atualizarAtivoSchema = z.object({
  nome: z.string().trim().min(1, 'Nome obrigatorio').max(120, 'Nome muito longo').optional(),
  ticker: z.string().trim().min(1, 'Ticker obrigatorio').max(24, 'Ticker muito longo').optional(),
  tipo: z.string().trim().min(1, 'Tipo obrigatorio').max(40, 'Tipo muito longo').optional(),
  moeda: z.string().trim().min(1, 'Moeda obrigatoria').max(12, 'Moeda muito longa').optional(),
  corretora: z.string().trim().min(1, 'Corretora invalida').max(80, 'Corretora muito longa').optional().nullable(),
  ativo: z.boolean().optional(),
})
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'Ao menos um campo deve ser fornecido',
  })

export const criarOperacaoSchema = z.object({
  ativoId: idSchema,
  contaId: optionalContaIdSchema,
  tipo: z.enum(TIPOS_OPERACAO_INVESTIMENTO, {
    errorMap: () => ({ message: 'Tipo de operacao invalido' }),
  }),
  quantidadeDecimal: quantidadeDecimalSchema,
  precoUnitarioCentavos: centavosPositivosSchema('precoUnitarioCentavos'),
  valorTotalCentavos: centavosPositivosSchema('valorTotalCentavos'),
  taxasCentavos: z.number()
    .int('taxasCentavos deve ser inteiro em centavos')
    .min(0, 'taxasCentavos nao pode ser negativo')
    .optional()
    .nullable(),
  dataOperacao: z.string().regex(DATE_REGEX, 'Data da operacao invalida - formato: YYYY-MM-DD'),
}).strict()

export const cancelarOperacaoSchema = z.object({
  id: idSchema,
}).strict()

export type CriarAtivoSchema = z.infer<typeof criarAtivoSchema>
export type AtualizarAtivoSchema = z.infer<typeof atualizarAtivoSchema>
export type CriarOperacaoSchema = z.infer<typeof criarOperacaoSchema>
export type CancelarOperacaoSchema = z.infer<typeof cancelarOperacaoSchema>

function isPositiveQuantityDecimal(value: string) {
  const [integerPart, decimalPart = ''] = value.replace(',', '.').split('.')
  return BigInt(integerPart) > BigInt(0) || BigInt(decimalPart.padEnd(8, '0') || '0') > BigInt(0)
}
