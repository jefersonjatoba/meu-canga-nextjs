import { prisma } from '@/lib/prisma'
import { getActivePlan, atingiuLimite } from '@/lib/plans'
import type { LimiteKey } from '@/lib/plans'

type UserPlanInfo = { plan: string; planExpiresAt: Date | null }

export interface CheckResult {
  ok: boolean
  atual?: number
  limite?: number
  recurso?: string
}

function mesAtualRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function planOk(user: UserPlanInfo, chave: LimiteKey): boolean {
  return getActivePlan(user).limites[chave] === Infinity
}

function buildResult(ok: boolean, atual: number, limite: number, recurso: string): CheckResult {
  return ok ? { ok: true } : { ok: false, atual, limite, recurso }
}

// ─── Lançamentos ──────────────────────────────────────────────────────────────

export async function checkLancamentos(userId: string, user: UserPlanInfo): Promise<CheckResult> {
  if (planOk(user, 'lancamentos_mes')) return { ok: true }
  const { start, end } = mesAtualRange()
  const plan  = getActivePlan(user)
  const atual = await prisma.lancamento.count({
    where: { userId, data: { gte: start, lte: end } },
  })
  const limite = plan.limites.lancamentos_mes
  return buildResult(!atingiuLimite(plan, 'lancamentos_mes', atual), atual, limite, 'limite_lancamentos')
}

// ─── RAS ──────────────────────────────────────────────────────────────────────

export async function checkRas(userId: string, user: UserPlanInfo): Promise<CheckResult> {
  if (planOk(user, 'ras_mes')) return { ok: true }
  const { start, end } = mesAtualRange()
  const plan  = getActivePlan(user)
  const atual = await prisma.rasAgenda.count({
    where: {
      userId,
      createdAt: { gte: start, lte: end },
      status:    { not: 'cancelado' },
      deletadoEm: null,
    },
  })
  const limite = plan.limites.ras_mes
  return buildResult(!atingiuLimite(plan, 'ras_mes', atual), atual, limite, 'limite_ras')
}

// ─── Metas ────────────────────────────────────────────────────────────────────

export async function checkMetas(userId: string, user: UserPlanInfo): Promise<CheckResult> {
  if (planOk(user, 'metas')) return { ok: true }
  const plan  = getActivePlan(user)
  const atual = await prisma.meta.count({
    where: { userId, status: 'ativa' },
  })
  const limite = plan.limites.metas
  return buildResult(!atingiuLimite(plan, 'metas', atual), atual, limite, 'limite_metas')
}

// ─── Recorrências ─────────────────────────────────────────────────────────────

export async function checkRecorrencias(userId: string, user: UserPlanInfo): Promise<CheckResult> {
  if (planOk(user, 'recorrencias')) return { ok: true }
  const plan  = getActivePlan(user)
  const atual = await prisma.recorrencia.count({
    where: { userId, ativa: true },
  })
  const limite = plan.limites.recorrencias
  return buildResult(!atingiuLimite(plan, 'recorrencias', atual), atual, limite, 'limite_recorrencias')
}

// ─── Contas ───────────────────────────────────────────────────────────────────

export async function checkContas(userId: string, user: UserPlanInfo): Promise<CheckResult> {
  if (planOk(user, 'contas')) return { ok: true }
  const plan  = getActivePlan(user)
  const atual = await prisma.conta.count({
    where: { userId },
  })
  const limite = plan.limites.contas
  return buildResult(!atingiuLimite(plan, 'contas', atual), atual, limite, 'limite_contas')
}
