import { getApiUser, okResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// GET /api/referral — retorna código e lista de indicados
export async function GET() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    // Garante que o usuário tem um referralCode
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    })

    let code = row?.referralCode
    if (!code) {
      // Gera código único de 8 chars (maiúsculas + números)
      do {
        code = nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8)
      } while (await prisma.user.findUnique({ where: { referralCode: code } }))

      await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referred: { select: { name: true, email: true, plan: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const rewardedCount = referrals.filter((r) => r.rewarded).length
    const totalCount    = referrals.length

    return okResponse({
      code,
      link: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://meu-canga.com'}/auth/register?ref=${code}`,
      total: totalCount,
      rewarded: rewardedCount,
      mesesGanhos: rewardedCount,   // 1 mês grátis por indicação convertida
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.referred.name,
        plan: r.referred.plan,
        createdAt: r.referred.createdAt,
        rewarded: r.rewarded,
      })),
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
