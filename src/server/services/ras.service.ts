// RAS Service — orchestrates business logic, validations, and state transitions.
// Rules:
//   1. All business rules live here; repositories are pure data access.
//   2. userId always comes from session — never trust client payload.
//   3. Raise RasDomainError so routes can map to the correct HTTP status.
//   4. Never import from API routes — dependency flows inward only.

import * as rasRepo   from '@/server/repositories/ras.repository'
import * as escalaRepo from '@/server/repositories/escala.repository'
import * as auditRepo from '@/server/repositories/ras-audit.repository'
import { RasErrorCode, RasDomainError } from '@/lib/ras-errors'
import { calculateRestRequirementsBetween } from '@/lib/ras-calculations'
import {
  RAS_MAX_MONTHLY_HOURS,
  RAS_REALIZE_WINDOW_HOURS,
} from '@/types/ras'
import { isWithinConfirmationWindow } from '@/lib/ras-calculations'
import type {
  RasAgenda,
  StatusRas,
  CreateRasAgendaInput,
  RasMonthStats,
  RasHistoricoMes,
} from '@/types/ras'

// ─── Allowed state transitions ────────────────────────────────────────────────
// Based on: agendado → realizado → pendente → confirmado | Any → cancelado

const VALID_TRANSITIONS: Record<StatusRas, StatusRas[]> = {
  agendado:   ['realizado', 'cancelado'],
  realizado:  ['pendente', 'confirmado', 'cancelado'],
  pendente:   ['confirmado','cancelado'],
  confirmado: [],
  cancelado:  [],
}

function assertTransition(current: StatusRas, next: StatusRas): void {
  if (!VALID_TRANSITIONS[current].includes(next)) {
    throw new RasDomainError(
      RasErrorCode.TRANSITION_INVALID,
      `Transição de "${current}" para "${next}" não é permitida`,
      { current, next },
    )
  }
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the given date/time window conflicts with any active escala
 * for the user (same day, overlapping hours).
 */
export async function validarConflitosEscala(
  userId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
): Promise<boolean> {
  const conflict = await escalaRepo.findEscalaConflict(userId, data, horaInicio, horaFim)
  return conflict !== null
}

/**
 * Validates the 8-hour minimum rest rule between consecutive RAS events.
 * Returns null when valid, or the conflicting RasAgenda when violated.
 */
export async function validarDescansoMinimo(
  userId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
): Promise<RasAgenda | null> {
  const { before, after } = await rasRepo.findAdjacentRas(userId, data, horaInicio, horaFim)

  // Build a stub RasAgenda for the proposed event to reuse the shared helper
  const proposed: RasAgenda = {
    id: '',
    userId,
    data,
    horaInicio,
    horaFim,
    duracao: 6,   // duracao is irrelevant for the gap calculation
    local: '',
    graduacao: 'SD/CB',
    tipo: 'voluntario',
    tipoVaga: 'titular',
    valorCentavos: 0,
    status: 'agendado',
    competencia: data.slice(0, 7),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (before) {
    const { valid } = calculateRestRequirementsBetween(before, proposed)
    if (!valid) return before  // rest violated — return the conflicting record
  }

  if (after) {
    const { valid } = calculateRestRequirementsBetween(proposed, after)
    if (!valid) return after  // rest violated — return the conflicting record
  }

  return null
}

/**
 * Returns true if adding `novasDuracao` hours would exceed the 120h monthly cap.
 */
export async function validarHorariosMensais(
  userId: string,
  competencia: string,
  novasDuracao: number,
): Promise<boolean> {
  const horasAtuais = await rasRepo.countRasHoursByUserAndMonth(userId, competencia)
  return horasAtuais + novasDuracao > RAS_MAX_MONTHLY_HOURS
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Calculates the auto-status for a new RAS based on its date relative to today (SP timezone).
 * - Past date  → 'realizado' (user is registering something that already happened)
 * - Today/future → 'agendado'
 */
function calcAutoStatus(dataStr: string): StatusRas {
  const nowBR = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
  const todayStr = `${nowBR.getFullYear()}-${String(nowBR.getMonth() + 1).padStart(2, '0')}-${String(nowBR.getDate()).padStart(2, '0')}`
  return dataStr < todayStr ? 'realizado' : 'agendado'
}

/**
 * Validates business rules and creates a new RAS.
 * Returns the created record and any non-blocking warning codes.
 *
 * - Escala conflict is a hard blocker (overlap means the user is physically present).
 * - Monthly hours exceeded and duplicate RAS are hard blockers.
 * - Minimum rest violation is a hard blocker.
 * - Auto-status: past date → 'realizado', future/today → 'agendado' (FIX-2).
 */
export async function criarRasAgendado(
  userId: string,
  input: CreateRasAgendaInput,
): Promise<{ ras: RasAgenda; warnings: RasErrorCode[] }> {
  const warnings: RasErrorCode[] = []

  // 1. Duplicate check (hard blocker) — explicit check before hitting unique constraint
  const isDuplicate = await rasRepo.existsDuplicateRas(userId, input.data, input.horaInicio)
  if (isDuplicate) {
    throw new RasDomainError(
      RasErrorCode.DUPLICATE_RAS,
      `Já existe um RAS agendado em ${input.data} às ${input.horaInicio}`,
      { data: input.data, horaInicio: input.horaInicio },
    )
  }

  // 2. Monthly hours cap (hard blocker)
  const horasExcedidas = await validarHorariosMensais(userId, input.competencia, input.duracao)
  if (horasExcedidas) {
    const horasAtuais = await rasRepo.countRasHoursByUserAndMonth(userId, input.competencia)
    throw new RasDomainError(
      RasErrorCode.MONTHLY_HOURS_EXCEEDED,
      `Limite de ${RAS_MAX_MONTHLY_HOURS}h/mês seria excedido. Horas utilizadas: ${horasAtuais}h`,
      { competencia: input.competencia, horasAtuais, novasDuracao: input.duracao },
    )
  }

  // 3. Minimum rest check (hard blocker) — FIX-6: returns conflicting record for rich error message
  const conflitanteDescanso = await validarDescansoMinimo(userId, input.data, input.horaInicio, input.horaFim)
  if (conflitanteDescanso) {
    throw new RasDomainError(
      RasErrorCode.MIN_REST_VIOLATED,
      `Intervalo mínimo de 8h entre RAS não respeitado. Conflita com RAS em ${conflitanteDescanso.horaInicio}–${conflitanteDescanso.horaFim}.`,
      { data: input.data, horaInicio: input.horaInicio, conflito: { horaInicio: conflitanteDescanso.horaInicio, horaFim: conflitanteDescanso.horaFim } },
    )
  }

  // 4. Escala conflict check (hard blocker — FIX-3: usar escalaRepo)
  const escalaConflito = await escalaRepo.findEscalaConflict(userId, input.data, input.horaInicio, input.horaFim)
  if (escalaConflito) {
    throw new RasDomainError(
      RasErrorCode.ESCALA_CONFLICT,
      `Conflito com plantão na Escala: ${escalaConflito.tipoPlantao} (${escalaConflito.horaInicio}–${escalaConflito.horaFim})`,
      { data: input.data, tipoPlantao: escalaConflito.tipoPlantao, horaInicio: escalaConflito.horaInicio, horaFim: escalaConflito.horaFim },
    )
  }

  // 5. Auto-status: past date → 'realizado'; today/future → 'agendado' (FIX-2)
  const autoStatus = calcAutoStatus(input.data)

  const ras = await rasRepo.createRasAgenda(userId, input, autoStatus)

  // Log: RAS criado com sucesso
  await logRasEvent(
    userId,
    ras.id,
    'criado',
    `RAS agendado para ${input.data} às ${input.horaInicio}-${input.horaFim} (${input.duracao}h) - Status: ${autoStatus}`,
    {
      dadosDepois: {
        data: input.data,
        horaInicio: input.horaInicio,
        horaFim: input.horaFim,
        duracao: input.duracao,
        local: input.local,
        graduacao: input.graduacao,
        tipo: input.tipo,
        tipoVaga: input.tipoVaga,
        valor: ras.valorCentavos,
        status: autoStatus,
      },
    }
  )

  return { ras, warnings }
}

// ─── State transitions ────────────────────────────────────────────────────────

/**
 * Transitions agendado → realizado and opens the 72h confirmation window.
 */
export async function marcarRealizado(
  id: string,
  userId: string,
): Promise<{ ras: RasAgenda; expiresAt: Date }> {
  const existing = await rasRepo.findRasByIdForUser(id, userId)
  if (!existing) {
    throw new RasDomainError(RasErrorCode.NOT_FOUND, `RAS ${id} não encontrado`)
  }

  assertTransition(existing.status, 'realizado')

  const expiresAt = new Date(Date.now() + RAS_REALIZE_WINDOW_HOURS * 3_600_000)
  const ras = await rasRepo.updateRasStatus(id, userId, 'realizado', { expiresAt })

  // Log: Marcado como realizado
  await logRasEvent(
    userId,
    id,
    'marcar_realizado',
    `RAS marcado como realizado. Janela de confirmação: ${RAS_REALIZE_WINDOW_HOURS}h`,
    {
      dadosAntes: { status: existing.status },
      dadosDepois: { status: 'realizado', expiresAt: expiresAt.toISOString() },
    }
  )

  return { ras, expiresAt }
}

/**
 * Transitions realizado → pendente (called automatically by expiry job, or manually).
 */
export async function marcarPendente(
  id: string,
  userId: string,
): Promise<RasAgenda> {
  const existing = await rasRepo.findRasByIdForUser(id, userId)
  if (!existing) {
    throw new RasDomainError(RasErrorCode.NOT_FOUND, `RAS ${id} não encontrado`)
  }

  assertTransition(existing.status, 'pendente')

  return rasRepo.updateRasStatus(id, userId, 'pendente', { expiresAt: null })
}

/**
 * Transitions pendente → confirmado, or realizado → confirmado while the
 * 72-hour confirmation window is still open.
 */
export async function confirmarRas(
  id: string,
  userId: string,
  observacoes?: string,
): Promise<RasAgenda> {
  const existing = await rasRepo.findRasByIdForUser(id, userId)
  if (!existing) {
    throw new RasDomainError(RasErrorCode.NOT_FOUND, `RAS ${id} não encontrado`)
  }

  if (
    existing.status === 'realizado' &&
    !isWithinConfirmationWindow(existing.data, new Date())
  ) {
    throw new RasDomainError(
      RasErrorCode.TRANSITION_INVALID,
      'A janela de 72h para confirmação direta expirou. Este RAS deve seguir como pendente até o pagamento.',
      { current: existing.status, next: 'confirmado' },
    )
  }

  assertTransition(existing.status, 'confirmado')

  const ras = await rasRepo.updateRasStatus(id, userId, 'confirmado', {
    observacoes: observacoes ?? null,
  })

  // Log: Confirmado
  await logRasEvent(
    userId,
    id,
    'confirmar',
    `RAS confirmado${observacoes ? ` com observação: ${observacoes}` : ''}`,
    {
      dadosAntes: { status: existing.status },
      dadosDepois: { status: 'confirmado', observacoes },
    }
  )

  return ras
}

/**
 * Soft-deletes a RAS (marks as deleted, preserves audit trail).
 * This is the new standard for user-initiated deletes.
 * Hard deletes are only for admins doing data cleanup.
 */
export async function deletarRas(
  id: string,
  userId: string,
  motivo?: string,
): Promise<void> {
  const existing = await rasRepo.findRasByIdForUser(id, userId)
  if (!existing) {
    throw new RasDomainError(RasErrorCode.NOT_FOUND, `RAS ${id} não encontrado`)
  }

  // Soft delete (mark as deleted)
  try {
    await rasRepo.softDeleteRas(id, userId, motivo)
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('RAS_NOT_FOUND:')) {
      throw new RasDomainError(RasErrorCode.NOT_FOUND, `RAS ${id} não encontrado ou já foi deletado`)
    }
    throw err
  }

  // Log: Soft delete
  await logRasEvent(
    userId,
    id,
    'deletado',
    `RAS deletado${motivo ? ` (Motivo: ${motivo})` : ''}. Era ${existing.status}`,
    {
      motivoDelecao: motivo,
      dadosAntes: {
        status: existing.status,
        data: existing.data,
        horaInicio: existing.horaInicio,
      },
      dadosDepois: { deletadoEm: new Date().toISOString() },
    }
  )
}

/**
 * Cancels any non-terminal RAS by soft-deleting it.
 * This prevents cancelled RAS from blocking new schedules.
 */
export async function cancelarRas(
  id: string,
  userId: string,
): Promise<RasAgenda> {
  const existing = await rasRepo.findRasByIdForUser(id, userId)
  if (!existing) {
    throw new RasDomainError(RasErrorCode.NOT_FOUND, `RAS ${id} não encontrado`)
  }

  assertTransition(existing.status, 'cancelado')

  // Soft delete instead of status change: prevents blocking new schedules
  await rasRepo.softDeleteRas(id, userId, 'Cancelado pelo usuário')

  // Log: Cancelado (soft delete)
  await logRasEvent(
    userId,
    id,
    'cancelado',
    `RAS cancelado e removido. Status anterior: ${existing.status}`,
    {
      dadosAntes: {
        status: existing.status,
        data: existing.data,
        horaInicio: existing.horaInicio,
      },
      dadosDepois: { deletadoEm: new Date().toISOString() },
    }
  )

  return { ...existing, status: 'cancelado' as StatusRas }
}

// ─── Monthly stats ────────────────────────────────────────────────────────────

/**
 * Builds RasMonthStats for `userId` in `competencia` (YYYY-MM).
 * Includes a 3-month rolling history (current month and 2 preceding months).
 */
export async function getStatsDoMes(
  userId: string,
  competencia: string,
): Promise<RasMonthStats> {
  const [year, month] = competencia.split('-').map(Number)

  const allRas = await rasRepo.findRasByUserAndMonth(userId, competencia)

  // Per-status aggregates
  const zeroStatus = (): Record<StatusRas, number> => ({
    agendado: 0, realizado: 0, pendente: 0, confirmado: 0, cancelado: 0,
  })

  const horasPorStatus     = zeroStatus()
  const contagemPorStatus  = zeroStatus()
  const centavosPorStatus  = zeroStatus()
  const horasPorGraduacao: Record<string, number> = {}

  for (const r of allRas) {
    const s = r.status
    horasPorStatus[s]    += r.duracao
    contagemPorStatus[s] += 1
    centavosPorStatus[s] += r.valorCentavos
    horasPorGraduacao[r.graduacao] = (horasPorGraduacao[r.graduacao] ?? 0) + r.duracao
  }

  const nonCancelled = allRas.filter(r => r.status !== 'cancelado')
  const totalHoras     = nonCancelled.reduce((s, r) => s + r.duracao, 0)
  const totalCentavos  = nonCancelled.reduce((s, r) => s + r.valorCentavos, 0)
  const totalEventos   = nonCancelled.length
  const eventosPendentes   = contagemPorStatus.pendente + contagemPorStatus.agendado
  const eventosConfirmados = contagemPorStatus.confirmado

  const percentualLimite = Math.round((totalHoras / RAS_MAX_MONTHLY_HOURS) * 100)
  const alertaLimite     = totalHoras >= 96
  const horasRestantes   = Math.max(0, RAS_MAX_MONTHLY_HOURS - totalHoras)

  // 3-month rolling history
  const historico3Meses: RasHistoricoMes[] = []
  for (let i = 2; i >= 0; i--) {
    let m = month - i
    let y = year
    if (m <= 0) { m += 12; y -= 1 }
    const comp = `${y}-${String(m).padStart(2, '0')}`
    const rows = await rasRepo.findRasByUserAndMonth(userId, comp)
    const active = rows.filter(r => r.status !== 'cancelado')
    historico3Meses.push({
      competencia:    comp,
      totalHoras:     active.reduce((s, r) => s + r.duracao, 0),
      totalCentavos:  active.reduce((s, r) => s + r.valorCentavos, 0),
    })
  }

  return {
    competencia,
    totalHoras,
    totalCentavos,
    totalEventos,
    eventosPendentes,
    eventosConfirmados,
    percentualLimite,
    alertaLimite,
    horasRestantes,
    horasPorStatus,
    contagemPorStatus,
    centavosPorStatus,
    horasPorGraduacao,
    historico3Meses,
  }
}

// ─── Audit Logging ───────────────────────────────────────────────────────────

/**
 * Registra um evento de auditoria para ações em RAS.
 * Deve ser chamado APÓS a ação ser bem-sucedida no banco de dados.
 */
export async function logRasEvent(
  userId: string,
  rasId: string,
  acao: string,
  descricao: string,
  extras?: {
    motivoDelecao?: string
    dadosAntes?: Record<string, unknown>
    dadosDepois?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  try {
    await auditRepo.createAuditLog({
      userId,
      rasAgendaId: rasId,
      acao,
      descricao,
      motivoDelecao: extras?.motivoDelecao,
      dadosAntes: extras?.dadosAntes,
      dadosDepois: extras?.dadosDepois,
      ipAddress: extras?.ipAddress,
      userAgent: extras?.userAgent,
    })
  } catch (err) {
    // Logging falhou, mas não deve interromper a operação principal
    console.error(`[AUDIT] Falha ao registrar evento: ${acao}`, err)
  }
}

/**
 * Exporta repositório de audit para acesso direto.
 */
export { findAuditLogsByUser, findAuditLogsByRasId } from '@/server/repositories/ras-audit.repository'
