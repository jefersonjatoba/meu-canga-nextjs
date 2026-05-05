// RAS Audit Repository — sole Prisma access point for RasAuditLog records.
// Rules:
//   1. Every audit log is append-only (no updates or deletes).
//   2. Always include userId context for compliance.
//   3. Never log sensitive data (senhas, tokens, dados de cartão).
//   4. Audit events should be created AFTER successful DB changes.

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { RasAuditLog } from '@prisma/client'

export interface CreateAuditLogInput {
  userId: string
  rasAgendaId: string
  acao: string
  descricao: string
  motivoDelecao?: string
  dadosAntes?: Record<string, unknown>
  dadosDepois?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Cria um log de auditoria para rastrear ações no RAS.
 * Append-only: nunca atualiza ou deleta logs existentes.
 */
export async function createAuditLog(
  input: CreateAuditLogInput
): Promise<RasAuditLog> {
  return prisma.rasAuditLog.create({
    data: {
      userId: input.userId,
      rasAgendaId: input.rasAgendaId,
      acao: input.acao,
      descricao: input.descricao,
      motivoDelecao: input.motivoDelecao ?? null,
      dadosAntes: input.dadosAntes !== undefined ? (input.dadosAntes as Prisma.InputJsonValue) : undefined,
      dadosDepois: input.dadosDepois !== undefined ? (input.dadosDepois as Prisma.InputJsonValue) : undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  })
}

/**
 * Retorna todos os logs de auditoria para um usuário, ordenados por data descrescente.
 */
export async function findAuditLogsByUser(
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{ logs: RasAuditLog[]; total: number }> {
  const [logs, total] = await Promise.all([
    prisma.rasAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.rasAuditLog.count({ where: { userId } }),
  ])

  return { logs, total }
}

/**
 * Retorna logs de um RAS específico.
 */
export async function findAuditLogsByRasId(
  rasAgendaId: string
): Promise<RasAuditLog[]> {
  return prisma.rasAuditLog.findMany({
    where: { rasAgendaId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Conta quantas ações de um tipo específico um usuário fez em um período.
 * Útil para detectar comportamento suspeito.
 */
export async function countActionsByUserAndType(
  userId: string,
  acao: string,
  desde: Date,
  ate: Date
): Promise<number> {
  return prisma.rasAuditLog.count({
    where: {
      userId,
      acao,
      createdAt: {
        gte: desde,
        lte: ate,
      },
    },
  })
}
