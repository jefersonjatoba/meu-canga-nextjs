// PATCH /api/contas/:id - atualiza ou desativa conta do usuario autenticado
// DELETE /api/contas/:id - exclui permanentemente (apenas se sem lançamentos)

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
  nome: z.string().min(1).max(100).optional(),
  tipo: z.enum(TIPOS_CONTA).optional(),
  banco: z.string().max(100).optional().nullable(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  limiteCentavos: z.number().int().positive().optional().nullable(),
  diaFechamento: z.number().int().min(1).max(31).optional().nullable(),
  diaVencimento: z.number().int().min(1).max(31).optional().nullable(),
  ativa: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Ao menos um campo deve ser fornecido' })

const contaSelect = {
  id: true,
  nome: true,
  tipo: true,
  banco: true,
  cor: true,
  saldoCentavos: true,
  limiteCentavos: true,
  diaFechamento: true,
  diaVencimento: true,
  ativa: true,
  createdAt: true,
} as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const conta = await prisma.conta.findUnique({ where: { id } })
    if (!conta) return notFoundResponse('Conta')
    if (conta.userId !== user.id) return forbiddenResponse()

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisicao invalido')

    const parsed = updateContaSchema.safeParse(body)
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message)

    const nextTipo = parsed.data.tipo ?? conta.tipo
    const data = nextTipo === 'credit'
      ? parsed.data
      : {
          ...parsed.data,
          limiteCentavos: null,
          diaFechamento: null,
          diaVencimento: null,
        }

    if (nextTipo === 'credit') {
      const diaFechamento = data.diaFechamento ?? conta.diaFechamento
      const diaVencimento = data.diaVencimento ?? conta.diaVencimento
      if (diaFechamento == null || diaVencimento == null) {
        return errorResponse('Cartao de credito precisa de fechamento e vencimento')
      }
    }

    const updated = await prisma.conta.update({
      where: { id },
      data,
      select: contaSelect,
    })

    return okResponse(updated)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const conta = await prisma.conta.findUnique({ where: { id } })
    if (!conta) return notFoundResponse('Conta')
    if (conta.userId !== user.id) return forbiddenResponse()

    const totalLancamentos = await prisma.lancamento.count({ where: { contaId: id } })
    if (totalLancamentos > 0) {
      return errorResponse(
        'Esta conta possui lançamentos e não pode ser excluída. Desative-a para removê-la do painel.',
        422,
      )
    }

    await prisma.conta.delete({ where: { id } })
    return okResponse({ id })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
