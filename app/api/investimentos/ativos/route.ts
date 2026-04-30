import type { NextRequest } from 'next/server'
import { ZodError } from 'zod'

import { criarAtivoSchema } from '@/features/investimentos/schemas'
import {
  createdResponse,
  errorResponse,
  getApiUser,
  okResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-auth'
import {
  InvestmentValidationError,
  criarAtivo,
  listarAtivos,
} from '@/server/services/investment.service'

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const ativos = await listarAtivos(user.id)
    return okResponse(ativos)
  } catch (err) {
    if (err instanceof InvestmentValidationError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const validated = criarAtivoSchema.parse(body)
    const ativo = await criarAtivo(user.id, validated)
    return createdResponse(ativo)
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(firstZodMessage(err))
    if (err instanceof InvestmentValidationError) return errorResponse(err.message, err.statusCode)
    return serverErrorResponse(err)
  }
}

function firstZodMessage(err: ZodError) {
  return err.errors[0]?.message ?? 'Dados invalidos'
}
