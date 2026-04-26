import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  getApiUser,
  okResponse,
  createdResponse,
  errorResponse,
  notFoundResponse,
  forbiddenResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'

const createPagamentoSchema = z.object({
  valorCentavos: z
    .number({ required_error: 'Valor é obrigatório' })
    .int()
    .positive('Valor deve ser positivo'),
  dataPagamento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD')
    .optional(),
  comprovante: z.string().max(500).optional(),
  observacoes: z.string().max(500).optional(),
})

// ─── GET /api/ras/[id]/pagamentos ─────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const rasAgenda = await prisma.rasAgenda.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!rasAgenda) return notFoundResponse('RAS')
    if (rasAgenda.userId !== user.id) return forbiddenResponse()

    const pagamentos = await prisma.rasPagamento.findMany({
      where: { rasAgendaId: id },
      orderBy: { createdAt: 'desc' },
    })

    return okResponse(pagamentos)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// ─── POST /api/ras/[id]/pagamentos ────────────────────────────────────────────
// Registra um pagamento para um RAS confirmado ou pendente.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const { id } = await params

    const rasAgenda = await prisma.rasAgenda.findUnique({
      where: { id },
      select: { userId: true, status: true, competencia: true, valorCentavos: true },
    })
    if (!rasAgenda) return notFoundResponse('RAS')
    if (rasAgenda.userId !== user.id) return forbiddenResponse()

    if (!['confirmado', 'pendente'].includes(rasAgenda.status)) {
      return errorResponse(
        'Só é possível registrar pagamento para RAS confirmado ou pendente',
        422
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) return errorResponse('Corpo da requisição inválido')

    const parsed = createPagamentoSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message)
    }

    const { valorCentavos, dataPagamento, comprovante, observacoes } = parsed.data

    const pagamento = await prisma.rasPagamento.create({
      data: {
        rasAgendaId: id,
        userId: user.id,
        valorCentavos,
        competencia: rasAgenda.competencia,
        dataPagamento: dataPagamento
          ? new Date(dataPagamento + 'T12:00:00Z')
          : new Date(),
        comprovante: comprovante ?? null,
        observacoes: observacoes ?? null,
      },
    })

    return createdResponse(pagamento)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
