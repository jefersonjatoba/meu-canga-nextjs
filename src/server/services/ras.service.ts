// RAS Service — orchestrates business logic, validations, and state transitions.
// Rules:
//   1. All business rules live here; repositories are pure data access.
//   2. userId always comes from session — never trust client payload.
//   3. Raise RasDomainError so routes can map to the correct HTTP status.
//   4. Never import from API routes — dependency flows inward only.

import * as rasRepo   from '@/server/repositories/ras.repository'
import * as escalaRepo from '@/server/repositories/escala.repository'
import { RasErrorCode, RasDomainError } from '@/lib/ras-errors'
import { calculateRestRequirementsBetween } from '@/lib/ras-calculations'
import {
  RAS_MAX_MONTHLY_HOURS,
  RAS_REALIZE_WINDOW_HOURS,
} from '@/types/ras'
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
  realizado:  ['pendente',  'cancelado'],
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
 * Returns true when the 8-hour minimum rest between consecutive RAS events
 * would be violated by adding a new event at `horaInicio`/`horaFim` on `data`.
 */
export async function validarDescansoMinimo(
  userId: string,
  data: string,
  horaInicio: string,
  horaFim: string,
): Promise<boolean> {
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
    if (!valid) return true  // rest violated
  }

  if (after) {
    const { valid } = calculateRestRequirementsBetween(proposed, after)
    if (!valid) return true  // rest violated
  }

  return false
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
 * Validates business rules and creates a new RAS agendado.
 * Returns the created record and any non-blocking warning codes.
 *
 * Escalas conflict is a WARNING, not a hard blocker (military scheduling edge case).
 * Monthly hours exceeded and duplicate RAS ARE hard blockers.
 */
export async function criarRasAgendado(
  userId: string,
  input: CreateRasAgendaInput,
): Promise<{ ras: RasAgenda; warnings: RasErrorCode[] }> {
  const warnings: RasErrorCode[] = []

  // 1. Duplicate check (hard blocker)
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

  // 3. Minimum rest check (hard blocker)
  const restViolated = await validarDescansoMinimo(userId, input.data, input.horaInicio, input.horaFim)
  if (restViolated) {
    throw new RasDomainError(
      RasErrorCode.MIN_REST_VIOLATED,
      `Intervalo mínimo de 8h entre RAS consecutivos não seria respeitado`,
      { data: input.data, horaInicio: input.horaInicio },
    )
  }

  // 4. Escala conflict check (warning — not a hard blocker)
  const hasEscalaConflict = await validarConflitosEscala(userId, input.data, input.horaInicio, input.horaFim)
  if (hasEscalaConflict) {
    warnings.push(RasErrorCode.ESCALA_CONFLICT)
  }

  const ras = await rasRepo.createRasAgenda(userId, input)
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
 * Transitions pendente → confirmado.
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

  assertTransition(existing.status, 'confirmado')

  return rasRepo.updateRasStatus(id, userId, 'confirmado', { observacoes: observacoes ?? null })
}

/**
 * Cancels any non-terminal RAS (any → cancelado).
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

  return rasRepo.updateRasStatus(id, userId, 'cancelado')
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
