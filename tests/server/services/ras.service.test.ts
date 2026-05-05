import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─── Mock dependencies BEFORE service import ──────────────────────────────────

vi.mock('@/server/repositories/ras.repository', () => ({
  existsDuplicateRas: vi.fn(),
  countRasHoursByUserAndMonth: vi.fn(),
  findAdjacentRas: vi.fn(),
  createRasAgenda: vi.fn(),
  findRasByIdForUser: vi.fn(),
  updateRasStatus: vi.fn(),
  softDeleteRas: vi.fn(),
  findRasByUserAndMonth: vi.fn(),
}))

vi.mock('@/server/repositories/escala.repository', () => ({
  findEscalaConflict: vi.fn(),
}))

vi.mock('@/server/repositories/ras-audit.repository', () => ({
  createAuditLog: vi.fn(),
}))

vi.mock('@/lib/ras-calculations', () => ({
  calculateRestRequirementsBetween: vi.fn((before, after) => {
    return { valid: true }
  }),
}))

// ─── Import service and mocks AFTER vi.mock calls ─────────────────────────────

import * as rasService from '@/server/services/ras.service'
import * as rasRepo from '@/server/repositories/ras.repository'
import * as escalaRepo from '@/server/repositories/escala.repository'
import * as auditRepo from '@/server/repositories/ras-audit.repository'
import { RasDomainError, RasErrorCode } from '@/lib/ras-errors'
import type {
  RasAgenda,
  StatusRas,
  DuracaoRas,
  CreateRasAgendaInput,
} from '@/types/ras'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const userId = 'user-123'
const rasId = 'ras-456'

function createMockRas(overrides?: Partial<RasAgenda>): RasAgenda {
  return {
    id: rasId,
    userId,
    data: '2026-05-15',
    horaInicio: '08:00',
    horaFim: '14:00',
    duracao: 6,
    local: 'Delegacia Centro',
    graduacao: 'SD/CB',
    tipo: 'voluntario',
    tipoVaga: 'titular',
    valorCentavos: 30000,
    status: 'agendado',
    competencia: '2026-05',
    observacoes: null,
    expiresAt: null,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
    agendamentos: [],
    pagamentos: [],
    ...overrides,
  }
}

function createMockInput(overrides?: Partial<CreateRasAgendaInput>): CreateRasAgendaInput {
  return {
    data: '2026-05-15',
    horaInicio: '08:00',
    horaFim: '14:00',
    duracao: 6,
    local: 'Delegacia Centro',
    graduacao: 'SD/CB',
    tipo: 'voluntario',
    tipoVaga: 'titular',
    competencia: '2026-05',
    observacoes: undefined,
    ...overrides,
  }
}

// ─── criarRasAgendado ─────────────────────────────────────────────────────────

describe('RAS Service — criarRasAgendado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a RAS with agendado status for future date', async () => {
    const input = createMockInput({ data: '2026-12-25' })
    const mockRas = createMockRas({ data: '2026-12-25', status: 'agendado' })

    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(50)
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({ before: null, after: null })
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(null)
    vi.mocked(rasRepo.createRasAgenda).mockResolvedValue(mockRas)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const result = await rasService.criarRasAgendado(userId, input)

    expect(result.ras).toEqual(mockRas)
    expect(result.warnings).toEqual([])
  })

  it('should create a RAS with realizado status for past date', async () => {
    const input = createMockInput({ data: '2026-04-15' })
    const mockRas = createMockRas({ data: '2026-04-15', status: 'realizado' })

    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(50)
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({ before: null, after: null })
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(null)
    vi.mocked(rasRepo.createRasAgenda).mockResolvedValue(mockRas)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const result = await rasService.criarRasAgendado(userId, input)

    expect(result.ras.status).toBe('realizado')
  })

  it('should reject duplicate RAS', async () => {
    const input = createMockInput()
    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(true)

    await expect(rasService.criarRasAgendado(userId, input)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.createRasAgenda).not.toHaveBeenCalled()
  })

  it('should reject when monthly hours would be exceeded', async () => {
    const input = createMockInput({ duracao: 30 as unknown as DuracaoRas })
    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(100)

    await expect(rasService.criarRasAgendado(userId, input)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.createRasAgenda).not.toHaveBeenCalled()
  })

  it('should reject when escala conflict exists', async () => {
    const input = createMockInput()
    const mockEscala = {
      id: 'escala-123',
      tipoPlantao: '24x48',
      horaInicio: '08:00',
      horaFim: '08:00',
    }

    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(50)
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({ before: null, after: null })
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(mockEscala as any)

    await expect(rasService.criarRasAgendado(userId, input)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.createRasAgenda).not.toHaveBeenCalled()
  })

  it('should log RAS creation event after successful creation', async () => {
    const input = createMockInput()
    const mockRas = createMockRas()

    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(50)
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({ before: null, after: null })
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(null)
    vi.mocked(rasRepo.createRasAgenda).mockResolvedValue(mockRas)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.criarRasAgendado(userId, input)

    expect(auditRepo.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        rasAgendaId: rasId,
        acao: 'criado',
      })
    )
  })

  it('should reject when exactly exceeding 120h limit', async () => {
    const input = createMockInput({ duracao: 21 as unknown as DuracaoRas })
    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(100)

    await expect(rasService.criarRasAgendado(userId, input)).rejects.toThrow(
      RasDomainError
    )
  })

  it('should allow exactly at 120h limit', async () => {
    const input = createMockInput({ duracao: 20 as unknown as DuracaoRas })
    const mockRas = createMockRas({ duracao: 20 as unknown as DuracaoRas })

    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(100)
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({ before: null, after: null })
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(null)
    vi.mocked(rasRepo.createRasAgenda).mockResolvedValue(mockRas)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const result = await rasService.criarRasAgendado(userId, input)

    expect(result.ras).toBeDefined()
  })
})

// ─── marcarRealizado ──────────────────────────────────────────────────────────

describe('RAS Service — marcarRealizado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should transition agendado to realizado', async () => {
    const existing = createMockRas({ status: 'agendado' })
    const updated = createMockRas({ status: 'realizado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const result = await rasService.marcarRealizado(rasId, userId)

    expect(result.ras.status).toBe('realizado')
    expect(result.expiresAt).toBeDefined()
  })

  it('should set expiry window to 72 hours', async () => {
    const existing = createMockRas({ status: 'agendado' })
    const updated = createMockRas({ status: 'realizado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const beforeCall = Date.now()
    const result = await rasService.marcarRealizado(rasId, userId)
    const afterCall = Date.now()

    const expectedMinTime = beforeCall + 72 * 60 * 60 * 1000
    const expectedMaxTime = afterCall + 72 * 60 * 60 * 1000

    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinTime - 1000)
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxTime + 1000)
  })

  it('should reject if RAS not found', async () => {
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(null)

    await expect(rasService.marcarRealizado(rasId, userId)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.updateRasStatus).not.toHaveBeenCalled()
  })

  it('should reject invalid transition from realizado', async () => {
    const existing = createMockRas({ status: 'realizado' })
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)

    await expect(rasService.marcarRealizado(rasId, userId)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.updateRasStatus).not.toHaveBeenCalled()
  })

  it('should log realizado transition', async () => {
    const existing = createMockRas({ status: 'agendado' })
    const updated = createMockRas({ status: 'realizado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.marcarRealizado(rasId, userId)

    expect(auditRepo.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        rasAgendaId: rasId,
        acao: 'marcar_realizado',
      })
    )
  })
})

// ─── confirmarRas ─────────────────────────────────────────────────────────────

describe('RAS Service — confirmarRas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should transition pendente to confirmado', async () => {
    const existing = createMockRas({ status: 'pendente' })
    const updated = createMockRas({ status: 'confirmado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const result = await rasService.confirmarRas(rasId, userId)

    expect(result.status).toBe('confirmado')
  })

  it('should reject invalid transition from agendado', async () => {
    const existing = createMockRas({ status: 'agendado' })
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)

    await expect(rasService.confirmarRas(rasId, userId)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.updateRasStatus).not.toHaveBeenCalled()
  })

  it('should accept optional observacoes', async () => {
    const existing = createMockRas({ status: 'pendente' })
    const updated = createMockRas({
      status: 'confirmado',
      observacoes: 'Teste OK',
    })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.confirmarRas(rasId, userId, 'Teste OK')

    expect(rasRepo.updateRasStatus).toHaveBeenCalledWith(
      rasId,
      userId,
      'confirmado',
      expect.objectContaining({
        observacoes: 'Teste OK',
      })
    )
  })

  it('should log confirmation event', async () => {
    const existing = createMockRas({ status: 'pendente' })
    const updated = createMockRas({ status: 'confirmado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.confirmarRas(rasId, userId)

    expect(auditRepo.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        rasAgendaId: rasId,
        acao: 'confirmar',
      })
    )
  })
})

// ─── cancelarRas ──────────────────────────────────────────────────────────────

describe('RAS Service — cancelarRas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should transition agendado to cancelado', async () => {
    const existing = createMockRas({ status: 'agendado' })
    const updated = createMockRas({ status: 'cancelado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    const result = await rasService.cancelarRas(rasId, userId)

    expect(result.status).toBe('cancelado')
  })

  it('should reject invalid transition from confirmado', async () => {
    const existing = createMockRas({ status: 'confirmado' })
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)

    await expect(rasService.cancelarRas(rasId, userId)).rejects.toThrow(
      RasDomainError
    )
  })

  it('should allow cancellation from non-terminal states', async () => {
    const states: StatusRas[] = ['agendado', 'realizado', 'pendente']

    for (const status of states) {
      vi.clearAllMocks()

      const existing = createMockRas({ status })
      const updated = createMockRas({ status: 'cancelado' })

      vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
      vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
      vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

      const result = await rasService.cancelarRas(rasId, userId)
      expect(result.status).toBe('cancelado')
    }
  })

  it('should log cancelamento event', async () => {
    const existing = createMockRas({ status: 'agendado' })
    const updated = createMockRas({ status: 'cancelado' })

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.updateRasStatus).mockResolvedValue(updated)
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.cancelarRas(rasId, userId)

    expect(auditRepo.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        rasAgendaId: rasId,
        acao: 'cancelado',
      })
    )
  })
})

// ─── deletarRas ───────────────────────────────────────────────────────────────

describe('RAS Service — deletarRas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should soft-delete RAS', async () => {
    const existing = createMockRas()
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.softDeleteRas).mockResolvedValue()
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.deletarRas(rasId, userId)

    expect(rasRepo.softDeleteRas).toHaveBeenCalledWith(rasId, userId, undefined)
  })

  it('should soft-delete with motivo', async () => {
    const existing = createMockRas()
    const motivo = 'Agendamento incorreto'

    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.softDeleteRas).mockResolvedValue()
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.deletarRas(rasId, userId, motivo)

    expect(rasRepo.softDeleteRas).toHaveBeenCalledWith(rasId, userId, motivo)
  })

  it('should reject if RAS not found', async () => {
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(null)

    await expect(rasService.deletarRas(rasId, userId)).rejects.toThrow(
      RasDomainError
    )
    expect(rasRepo.softDeleteRas).not.toHaveBeenCalled()
  })

  it('should handle softDeleteRas errors and convert to RasDomainError', async () => {
    const existing = createMockRas()
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.softDeleteRas).mockRejectedValue(
      new Error('RAS_NOT_FOUND:ras-456')
    )

    await expect(rasService.deletarRas(rasId, userId)).rejects.toThrow(
      RasDomainError
    )
  })

  it('should log soft-delete event', async () => {
    const existing = createMockRas({ status: 'agendado' })
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)
    vi.mocked(rasRepo.softDeleteRas).mockResolvedValue()
    vi.mocked(auditRepo.createAuditLog).mockResolvedValue({} as any)

    await rasService.deletarRas(rasId, userId)

    expect(auditRepo.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        rasAgendaId: rasId,
        acao: 'deletado',
      })
    )
  })
})

// ─── getStatsDoMes ────────────────────────────────────────────────────────────

describe('RAS Service — getStatsDoMes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should aggregate stats by status', async () => {
    const competencia = '2026-05'
    const ras = [
      createMockRas({ status: 'agendado', duracao: 6 }),
      createMockRas({ status: 'realizado', duracao: 12 }),
      createMockRas({ status: 'realizado', duracao: 8 }),
      createMockRas({ status: 'confirmado', duracao: 10 as unknown as DuracaoRas }),
      createMockRas({ status: 'cancelado', duracao: 5 as unknown as DuracaoRas }),
    ]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(ras)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.horasPorStatus.agendado).toBe(6)
    expect(stats.horasPorStatus.realizado).toBe(20)
    expect(stats.horasPorStatus.confirmado).toBe(10)
    expect(stats.horasPorStatus.cancelado).toBe(5)
  })

  it('should exclude cancelado from totals', async () => {
    const competencia = '2026-05'
    const ras = [
      createMockRas({ status: 'agendado', duracao: 6 }),
      createMockRas({ status: 'cancelado', duracao: 50 as unknown as DuracaoRas }),
    ]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(ras)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.totalHoras).toBe(6)
    expect(stats.totalEventos).toBe(1)
  })

  it('should calculate percentage of monthly limit', async () => {
    const competencia = '2026-05'
    const ras = [createMockRas({ status: 'realizado', duracao: 60 as unknown as DuracaoRas })]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(ras)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.percentualLimite).toBe(50)
  })

  it('should alert when at 96h threshold', async () => {
    const competencia = '2026-05'
    const ras = [createMockRas({ status: 'realizado', duracao: 96 as unknown as DuracaoRas })]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(ras)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.alertaLimite).toBe(true)
  })

  it('should not alert below 96h', async () => {
    const competencia = '2026-05'
    const ras = [createMockRas({ status: 'realizado', duracao: 95 as unknown as DuracaoRas })]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(ras)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.alertaLimite).toBe(false)
  })

  it('should calculate remaining hours', async () => {
    const competencia = '2026-05'
    const ras = [createMockRas({ status: 'realizado', duracao: 100 as unknown as DuracaoRas })]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(ras)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.horasRestantes).toBe(20)
  })

  it('should include 3-month rolling history', async () => {
    const competencia = '2026-05'
    const mockRas = [createMockRas({ status: 'realizado', duracao: 50 as unknown as DuracaoRas })]

    vi.mocked(rasRepo.findRasByUserAndMonth).mockResolvedValue(mockRas)

    const stats = await rasService.getStatsDoMes(userId, competencia)

    expect(stats.historico3Meses).toHaveLength(3)
    expect(stats.historico3Meses[2].competencia).toBe('2026-05')
  })
})

// ─── Validation Helpers ───────────────────────────────────────────────────────

describe('RAS Service — validarConflitosEscala', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when escala conflict exists', async () => {
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue({
      tipoPlantao: '24x72',
      horaInicio: '08:00',
      horaFim: '08:00',
    } as any)

    const result = await rasService.validarConflitosEscala(
      userId,
      '2026-05-15',
      '10:00',
      '16:00'
    )

    expect(result).toBe(true)
  })

  it('should return false when no escala conflict', async () => {
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(null)

    const result = await rasService.validarConflitosEscala(
      userId,
      '2026-05-15',
      '10:00',
      '16:00'
    )

    expect(result).toBe(false)
  })
})

describe('RAS Service — validarDescansoMinimo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when rest is sufficient', async () => {
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({
      before: null,
      after: null,
    })

    const result = await rasService.validarDescansoMinimo(
      userId,
      '2026-05-15',
      '10:00',
      '16:00'
    )

    expect(result).toBeNull()
  })
})

describe('RAS Service — validarHorariosMensais', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when limit exceeded', async () => {
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(110)

    const result = await rasService.validarHorariosMensais(userId, '2026-05', 20)

    expect(result).toBe(true)
  })

  it('should return false when within limit', async () => {
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(100)

    const result = await rasService.validarHorariosMensais(userId, '2026-05', 20)

    expect(result).toBe(false)
  })
})

// ─── Error Handling ───────────────────────────────────────────────────────────

describe('RAS Service — Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw if audit logging fails', async () => {
    const input = createMockInput()
    const mockRas = createMockRas()

    vi.mocked(rasRepo.existsDuplicateRas).mockResolvedValue(false)
    vi.mocked(rasRepo.countRasHoursByUserAndMonth).mockResolvedValue(50)
    vi.mocked(rasRepo.findAdjacentRas).mockResolvedValue({ before: null, after: null })
    vi.mocked(escalaRepo.findEscalaConflict).mockResolvedValue(null)
    vi.mocked(rasRepo.createRasAgenda).mockResolvedValue(mockRas)
    vi.mocked(auditRepo.createAuditLog).mockRejectedValue(
      new Error('Database error')
    )

    const result = await rasService.criarRasAgendado(userId, input)

    expect(result.ras).toEqual(mockRas)
  })

  it('should raise RasDomainError for not found', async () => {
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(null)

    try {
      await rasService.marcarRealizado(rasId, userId)
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(RasDomainError)
      const domainErr = err as RasDomainError
      expect(domainErr.response.code).toBe(RasErrorCode.NOT_FOUND)
    }
  })

  it('should raise RasDomainError for invalid transition', async () => {
    const existing = createMockRas({ status: 'cancelado' })
    vi.mocked(rasRepo.findRasByIdForUser).mockResolvedValue(existing)

    try {
      await rasService.marcarRealizado(rasId, userId)
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(RasDomainError)
      const domainErr = err as RasDomainError
      expect(domainErr.response.code).toBe(RasErrorCode.TRANSITION_INVALID)
    }
  })
})
