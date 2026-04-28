// PATCH /api/contas/:id — atualiza ou desativa conta do usuário autenticado

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

const TIPOS_CONTA = ['checking', 'savings', 'credit', 'investment', 'wallet', 'custom'] as const

const updateContaSchema = z.object({
  nome:  z.string().min(1).max(100).optional(),
  tipo:  z.enum(TIPOS_CONTA).optional(),
  banco: z.string().max(100).optional().nullable(),
  cor:   z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  ativa: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo deve ser fornecido' })

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const conta = await prisma.conta.findUnique({ where: { id } })
    if (!conta) return notFoundResponse('Conta')
    if (conta.userId !== user.id) return forbiddenResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = updateContaSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const updated = await prisma.conta.update({
      where:  { id },
      data:   parsed.data,
      select: { id: true, nome: true, tipo: true, banco: true, cor: true, saldoCentavos: true, ativa: true, createdAt: true },
    })

    return okResponse(updated)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
