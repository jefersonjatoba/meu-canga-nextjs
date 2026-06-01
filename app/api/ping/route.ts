import { getApiUser, okResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// POST /api/ping — atualiza lastSeenAt e streak diário
export async function POST() {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastSeenAt: true, streakDays: true, longestStreak: true },
    })

    if (!row) return unauthorizedResponse()

    let streakDays = row.streakDays
    let longestStreak = row.longestStreak

    if (row.lastSeenAt) {
      const lastDay = new Date(
        row.lastSeenAt.getFullYear(),
        row.lastSeenAt.getMonth(),
        row.lastSeenAt.getDate()
      )
      const diffDays = Math.round((today.getTime() - lastDay.getTime()) / 86_400_000)

      if (diffDays === 0) {
        // Já foi registrado hoje — não faz nada com streak
      } else if (diffDays === 1) {
        // Dia seguinte consecutivo
        streakDays += 1
        if (streakDays > longestStreak) longestStreak = streakDays
      } else {
        // Quebrou o streak
        streakDays = 1
      }
    } else {
      streakDays = 1
      longestStreak = Math.max(1, longestStreak)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: now, streakDays, longestStreak },
    })

    return okResponse({ streakDays, longestStreak })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
