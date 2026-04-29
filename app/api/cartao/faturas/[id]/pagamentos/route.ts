import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import { pagarFaturaSchema } from '@/features/cartao/schemas'
import {
  ContaPagamentoInvalidaError,
  ContaPagamentoNotFoundOrForbiddenError,
  FaturaCartaoInvalidStateError,
  FaturaCartaoNotFoundOrForbiddenError,
  pagarFatura,
} from '@/server/services/cartao.service'

const pagarFaturaBodySchema = pagarFaturaSchema.omit({ faturaCartaoId: true })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const validatedBody = pagarFaturaBodySchema.parse(body)
    const pagamento = await pagarFatura(user.id, {
      faturaCartaoId: id,
      ...validatedBody,
    })

    return createdResponse(pagamento)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof FaturaCartaoNotFoundOrForbiddenError) return notFoundResponse('Fatura')
    if (err instanceof ContaPagamentoNotFoundOrForbiddenError) return notFoundResponse('Conta')
    if (err instanceof ContaPagamentoInvalidaError) return errorResponse(err.message, err.statusCode)
    if (err instanceof FaturaCartaoInvalidStateError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
