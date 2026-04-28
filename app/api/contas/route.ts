// GET  /api/contas — lista contas ativas do usuário autenticado
// POST /api/contas — cria nova conta

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  getApiUser,
  okResponse,
  createdResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

const TIPOS_CONTA = ['checking', 'savings', 'credit', 'investment', 'wallet', 'custom'] as const

const createContaSchema = z.object({
  nome:                 z.string().min(1, 'Nome obrigatório').max(100, 'Nome muito longo'),
  tipo:                 z.enum(TIPOS_CONTA, { errorMap: () => ({ message: 'Tipo de conta inválido' }) }),
  banco:                z.string().max(100).optional(),
  cor:                  z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida').optional(),
  saldoCentavos:        z.number().int().default(0),
})

export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    let contas = await prisma.conta.findMany({
      where:   { userId: user.id, ativa: true },
      select:  { id: true, nome: true, tipo: true, banco: true, cor: true, saldoCentavos: true, ativa: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    if (contas.length === 0) {
      const conta = await prisma.conta.create({
        data:   { userId: user.id, nome: 'Minha Conta', tipo: 'checking' },
        select: { id: true, nome: true, tipo: true, banco: true, cor: true, saldoCentavos: true, ativa: true, createdAt: true },
      })
      contas = [conta]
    }

    return okResponse(contas)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = createContaSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const { nome, tipo, banco, cor, saldoCentavos } = parsed.data

    const conta = await prisma.conta.create({
      data:   { userId: user.id, nome, tipo, banco, cor, saldoCentavos },
      select: { id: true, nome: true, tipo: true, banco: true, cor: true, saldoCentavos: true, ativa: true, createdAt: true },
    })

    return createdResponse(conta)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
