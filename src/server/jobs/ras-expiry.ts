// RAS Expiry Job — automatically transitions realizado → pendente after 72h
// Called hourly by cron job (e.g., EasyCron, Vercel Cron, or external scheduler)

import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/server/repositories/ras-audit.repository'
import { sendEmail, buildRasConfirmationTemplate } from '@/server/services/mailer.service'

/**
 * Auto-transition RAS from realizado → pendente if expiresAt has passed.
 * This happens when the 72h confirmation window expires without confirmation.
 *
 * Returns count of RAS transitioned.
 */
export async function processExpiredRas(): Promise<number> {
  try {
    const now = new Date()

    // Find all RAS that:
    // - Have status = 'realizado'
    // - Have expiresAt set and <= now
    // - Have not been soft-deleted
    const expiredRas = await prisma.rasAgenda.findMany({
      where: {
        status: 'realizado',
        deletadoEm: null,
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
        userId: true,
        status: true,
        data: true,
        horaInicio: true,
        duracao: true,
      },
    })

    if (expiredRas.length === 0) {
      console.log('[ras-expiry] Nenhum RAS expirado para processar')
      return 0
    }

    let transitioned = 0

    for (const ras of expiredRas) {
      try {
        // Transition: realizado → pendente
        await prisma.rasAgenda.update({
          where: { id: ras.id },
          data: {
            status: 'pendente',
            updatedAt: now,
          },
        })

        // Log the transition
        await createAuditLog({
          userId: ras.userId,
          rasAgendaId: ras.id,
          acao: 'status_transition_auto',
          descricao: `RAS automaticamente transicionado de realizado para pendente (janela de 72h expirada)`,
          dadosAntes: { status: 'realizado' },
          dadosDepois: { status: 'pendente' },
        })

        console.log(
          `[ras-expiry] RAS ${ras.id} (${ras.data} ${ras.horaInicio}h) transicionado: realizado → pendente`
        )
        transitioned++
      } catch (err) {
        console.error(`[ras-expiry] Erro ao transicionar RAS ${ras.id}:`, err instanceof Error ? err.message : String(err))
      }
    }

    console.log(`[ras-expiry] ${transitioned} RAS expirado(s) processado(s)`)
    return transitioned
  } catch (err) {
    console.error('[ras-expiry] Erro ao processar RAS expirados:', err instanceof Error ? err.message : String(err))
    return 0
  }
}

/**
 * Notify users with RAS pending confirmation (realizado status, within 72h window).
 * Sends email reminder via Brevo to confirm before the window expires.
 *
 * Returns count of users notified.
 */
export async function notifyRasAwaitingConfirmation(): Promise<number> {
  try {
    const now = new Date()
    let notified = 0

    // Find distinct users with RAS in 'realizado' status that will expire soon (< 24h remaining)
    const usersWithExpiring = await prisma.rasAgenda.findMany({
      where: {
        status: 'realizado',
        deletadoEm: null,
        expiresAt: {
          gt: now,
          lte: new Date(now.getTime() + 24 * 3600000), // Expires within next 24h
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    })

    for (const { userId } of usersWithExpiring) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        })

        if (!user?.email) continue

        // Get all RAS for this user that are about to expire
        const rasSoonToExpire = await prisma.rasAgenda.findMany({
          where: {
            userId,
            status: 'realizado',
            deletadoEm: null,
            expiresAt: {
              gt: now,
              lte: new Date(now.getTime() + 24 * 3600000),
            },
          },
          select: {
            id: true,
            data: true,
            horaInicio: true,
            duracao: true,
            valorCentavos: true,
            expiresAt: true,
          },
          orderBy: { expiresAt: 'asc' },
        })

        if (rasSoonToExpire.length === 0) continue

        // Calculate hours remaining for first RAS
        const firstRas = rasSoonToExpire[0]
        const hoursRemaining = Math.ceil((firstRas.expiresAt!.getTime() - now.getTime()) / (1000 * 3600))

        // Build email
        const htmlContent = buildRasConfirmationTemplate(
          user.name || 'Policial',
          hoursRemaining,
          rasSoonToExpire.map(r => ({
            data: r.data.toISOString().split('T')[0],
            duracao: r.duracao,
            valor: r.valorCentavos,
          }))
        )

        // Send email via Brevo
        const sent = await sendEmail({
          to: user.email,
          subject: `⏰ RAS Aguardando Confirmação (${hoursRemaining}h)`,
          htmlContent,
          tags: ['ras-reminder', 'transactional'],
        })

        if (sent) {
          console.log(
            `[ras-notify] Email enviado: ${user.name} (${user.email}) - ${rasSoonToExpire.length} RAS, ${hoursRemaining}h restantes`
          )
          notified++
        }
      } catch (err) {
        console.error(`[ras-notify] Erro ao notificar user ${userId}:`, err instanceof Error ? err.message : String(err))
      }
    }

    console.log(`[ras-notify] ${notified} usuário(s) notificado(s) com sucesso`)
    return notified
  } catch (err) {
    console.error('[ras-notify] Erro ao notificar RAS aguardando confirmação:', err instanceof Error ? err.message : String(err))
    return 0
  }
}
