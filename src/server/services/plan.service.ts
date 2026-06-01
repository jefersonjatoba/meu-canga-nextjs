import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Ativa o plano PRO para um usuário */
export async function grantPro(
  userId: string,
  opts: {
    endsAt: Date
    source: string
    amountCents?: number
    paymentRef?: string
    notes?: string
  }
) {
  await prisma.$transaction(async (tx) => {
    if (opts.paymentRef) {
      const existing = await tx.subscription.findFirst({
        where: {
          userId,
          source: opts.source,
          paymentRef: opts.paymentRef,
        },
        select: { id: true },
      })

      if (existing) return
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        plan: 'pro',
        planExpiresAt: opts.endsAt,
      },
    })

    await tx.subscription.create({
      data: {
        userId,
        plan: 'pro',
        status: 'active',
        source: opts.source,
        amountCents: opts.amountCents ?? 0,
        startsAt: new Date(),
        endsAt: opts.endsAt,
        paymentRef: opts.paymentRef,
        notes: opts.notes,
      },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

/** Cancela o plano PRO (downgrade imediato) */
export async function cancelPro(userId: string, reason?: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { plan: 'free', planExpiresAt: null },
    }),
    ...(sub
      ? [
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'cancelled', notes: reason },
          }),
        ]
      : []),
  ])
}

/** Pausa a assinatura PRO por 30 dias (estende planExpiresAt sem cobrança) */
export async function pauseSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planExpiresAt: true },
  })

  const base = user?.planExpiresAt && user.planExpiresAt > new Date()
    ? user.planExpiresAt
    : new Date()

  const newExpiry = new Date(base)
  newExpiry.setDate(newExpiry.getDate() + 30)

  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { planExpiresAt: newExpiry },
    }),
    ...(sub
      ? [
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'paused', notes: 'pausa_30_dias', endsAt: newExpiry },
          }),
        ]
      : []),
  ])

  return { newExpiry }
}

/** Aplica 50% OFF por 3 meses (estende planExpiresAt em 45 dias) */
export async function applyRetentionDiscount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planExpiresAt: true },
  })

  const base = user?.planExpiresAt && user.planExpiresAt > new Date()
    ? user.planExpiresAt
    : new Date()

  const newExpiry = new Date(base)
  newExpiry.setDate(newExpiry.getDate() + 45)

  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'paused'] } },
    orderBy: { createdAt: 'desc' },
  })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { plan: 'pro', planExpiresAt: newExpiry },
    }),
    ...(sub
      ? [
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'active', notes: 'desconto_retencao_50pct', endsAt: newExpiry },
          }),
        ]
      : []),
  ])

  return { newExpiry }
}

/** Expira assinaturas vencidas e faz downgrade de usuários */
export async function expireSubscriptions() {
  const now = new Date()

  const expired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      endsAt: { lte: now },
    },
    select: { id: true, userId: true },
  })

  if (!expired.length) return { expired: 0 }

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { status: 'expired' },
    }),
    prisma.user.updateMany({
      where: { id: { in: expired.map((s) => s.userId) } },
      data: { plan: 'free', planExpiresAt: null },
    }),
  ])

  return { expired: expired.length }
}
