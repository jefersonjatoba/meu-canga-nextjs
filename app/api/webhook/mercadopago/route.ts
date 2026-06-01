import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { grantPro, cancelPro } from '@/server/services/plan.service'
import { serverErrorResponse } from '@/lib/api-auth'

// Duração da assinatura em dias por período
const PLAN_DAYS: Record<string, number> = {
  monthly: 31,
  annual: 366,
}

/**
 * Webhook do Mercado Pago — recebe notificações de pagamento.
 * Referência: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.MP_WEBHOOK_SECRET
    if (!secret) {
      console.error('[webhook/mp] MP_WEBHOOK_SECRET nao configurado; webhook desabilitado por seguranca')
      return Response.json({ error: 'Webhook unavailable' }, { status: 503 })
    }

    const signatureHeader = request.headers.get('x-signature') ?? ''
    const sig = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice('sha256='.length)
      : ''

    const { createHmac, timingSafeEqual } = await import('crypto')
    const body = await request.text()
    const expected = createHmac('sha256', secret).update(body).digest('hex')

    const validSignature =
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig), Buffer.from(expected))

    if (!validSignature) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    return await handlePayload(payload)
  } catch (err) {
    return serverErrorResponse(err)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePayload(payload: any) {
  const { type, data } = payload

  if (type === 'payment') {
    const paymentId: string = data?.id
    if (!paymentId) return Response.json({ ok: true })

    // Buscar detalhes do pagamento na API do MP
    const mpToken = process.env.MP_ACCESS_TOKEN
    if (!mpToken) {
      console.error('[webhook/mp] MP_ACCESS_TOKEN não configurado')
      return Response.json({ ok: true })
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })

    if (!mpRes.ok) {
      console.error('[webhook/mp] Falha ao buscar pagamento:', paymentId)
      return Response.json({ ok: true })
    }

    const payment = await mpRes.json()
    const { status, external_reference, metadata, transaction_amount, currency_id } = payment

    // external_reference = userId (definido no momento da criação do pagamento)
    const userId = external_reference as string | undefined
    if (!userId) {
      console.warn('[webhook/mp] Pagamento sem external_reference:', paymentId)
      return Response.json({ ok: true })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      console.warn('[webhook/mp] Usuário não encontrado:', userId)
      return Response.json({ ok: true })
    }

    const period: string = metadata?.period ?? 'monthly'
    const days = PLAN_DAYS[period] ?? 31
    const amountCents = Math.round((transaction_amount ?? 0) * 100)

    if (status === 'approved') {
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + days)

      await grantPro(userId, {
        endsAt,
        source: 'mercadopago',
        amountCents,
        paymentRef: paymentId,
        notes: `period=${period} currency=${currency_id}`,
      })

      console.log(`[webhook/mp] PRO ativado: user=${userId} endsAt=${endsAt.toISOString()}`)
    } else if (status === 'refunded' || status === 'cancelled' || status === 'charged_back') {
      await cancelPro(userId, `mp_status=${status} payment=${paymentId}`)
      console.log(`[webhook/mp] PRO cancelado: user=${userId} status=${status}`)
    }
  }

  return Response.json({ ok: true })
}
