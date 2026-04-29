import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/meta.repository', () => ({
  runInTransaction: vi.fn(),
  listMetasByUser: vi.fn(),
  findMetaById: vi.fn(),
  findMetaByIdTx: vi.fn(),
  createMeta: vi.fn(),
  updateMeta: vi.fn(),
  updateMetaStatus: vi.fn(),
  findContaForMetaAporte: vi.fn(),
  createMetaAporte: vi.fn(),
  findMetaAporteById: vi.fn(),
  updateMetaAporteStatus: vi.fn(),
}))

import * as repo from '@/server/repositories/meta.repository'
import {
  calcularProgresso,
  cancelarAporte,
  ContaMetaInvalidaError,
  criarMeta,
  listarMetas,
  registrarAporte,
} from '@/server/services/meta.service'

const USER_A = 'user_aaa'
const USER_B = 'user_bbb'
const META_ID = 'meta_111'
const APORTE_ID = 'aporte_111'
const CONTA_ID = 'conta_111'
const tx = { __tx: true } as never

const now = new Date('2026-04-29T00:00:00.000Z')

const metaBase = {
  id: META_ID,
  userId: USER_A,
  descricao: 'Reserva de emergencia',
  categoria: 'poupanca',
  tipo: 'poupanca',
  valorAlvoCentavos: 100_000,
  valorAtualCentavos: 0,
  valorInicialCentavos: 10_000,
  dataInicio: new Date('2026-04-01T00:00:00.000Z'),
  dataAlvo: new Date('2026-12-31T00:00:00.000Z'),
  status: 'ativa',
  cor: '#2563eb',
  icone: null,
  ordem: 0,
  createdAt: now,
  updatedAt: now,
  aportes: [
    {
      id: APORTE_ID,
      userId: USER_A,
      metaId: META_ID,
      contaId: CONTA_ID,
      valorCentavos: 25_000,
      dataAporte: new Date('2026-04-10T00:00:00.000Z'),
      descricao: 'Primeiro aporte',
      status: 'confirmado',
      createdAt: now,
      updatedAt: now,
      conta: { id: CONTA_ID, nome: 'Conta Corrente', tipo: 'checking' },
    },
    {
      id: 'aporte_cancelado',
      userId: USER_A,
      metaId: META_ID,
      contaId: null,
      valorCentavos: 9_000,
      dataAporte: new Date('2026-04-15T00:00:00.000Z'),
      descricao: null,
      status: 'cancelado',
      createdAt: now,
      updatedAt: now,
      conta: null,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(repo.runInTransaction).mockImplementation(async fn => fn(tx))
  vi.mocked(repo.createMeta).mockResolvedValue({ ...metaBase, aportes: [] } as never)
  vi.mocked(repo.listMetasByUser).mockResolvedValue([metaBase] as never)
  vi.mocked(repo.findMetaByIdTx).mockResolvedValue(metaBase as never)
  vi.mocked(repo.findContaForMetaAporte).mockResolvedValue({
    id: CONTA_ID,
    nome: 'Conta Corrente',
    tipo: 'checking',
  } as never)
  vi.mocked(repo.createMetaAporte).mockResolvedValue({ id: 'aporte_novo' } as never)
  vi.mocked(repo.updateMetaStatus).mockResolvedValue({ count: 1 } as never)
  vi.mocked(repo.findMetaAporteById).mockResolvedValue(metaBase.aportes[0] as never)
  vi.mocked(repo.updateMetaAporteStatus).mockResolvedValue({ count: 1 } as never)
})

describe('calcularProgresso', () => {
  it('usa valor inicial e apenas aportes confirmados', () => {
    const result = calcularProgresso(metaBase)

    expect(result.progressoCentavos).toBe(35_000)
    expect(result.aportesConfirmadosCentavos).toBe(25_000)
    expect(result.valorRestanteCentavos).toBe(65_000)
    expect(result.percentual).toBe(35)
  })
})

describe('metas financeiras', () => {
  it('cria meta sem aceitar userId do client', async () => {
    await criarMeta(USER_A, {
      descricao: 'Reserva',
      tipo: 'poupanca',
      valorAlvoCentavos: 100_000,
      valorInicialCentavos: 10_000,
      dataInicio: '2026-04-01',
      dataAlvo: '2026-12-31',
    })

    expect(repo.runInTransaction).toHaveBeenCalledOnce()
    expect(repo.createMeta).toHaveBeenCalledWith(
      tx,
      USER_A,
      expect.objectContaining({
        descricao: 'Reserva',
        valorAlvoCentavos: 100_000,
      }),
    )
  })

  it('lista metas isolando por userId', async () => {
    await listarMetas(USER_B)

    expect(repo.listMetasByUser).toHaveBeenCalledWith(USER_B)
  })

  it('registra aporte sem criar lancamento nem alterar saldo', async () => {
    await registrarAporte(USER_A, META_ID, {
      contaId: CONTA_ID,
      valorCentavos: 10_000,
      dataAporte: '2026-04-20',
      descricao: 'Aporte',
    })

    expect(repo.findMetaByIdTx).toHaveBeenCalledWith(tx, USER_A, META_ID)
    expect(repo.findContaForMetaAporte).toHaveBeenCalledWith(tx, USER_A, CONTA_ID)
    expect(repo.createMetaAporte).toHaveBeenCalledWith(
      tx,
      USER_A,
      META_ID,
      expect.objectContaining({ valorCentavos: 10_000 }),
    )
    expect(repo.updateMetaStatus).toHaveBeenCalled()
  })

  it('rejeita aporte usando conta credit', async () => {
    vi.mocked(repo.findContaForMetaAporte).mockResolvedValue({
      id: 'card_111',
      nome: 'Cartao',
      tipo: 'credit',
    } as never)

    await expect(registrarAporte(USER_A, META_ID, {
      contaId: 'card_111',
      valorCentavos: 10_000,
      dataAporte: '2026-04-20',
    })).rejects.toThrow(ContaMetaInvalidaError)

    expect(repo.createMetaAporte).not.toHaveBeenCalled()
  })

  it('cancela aporte preservando historico e recalculando progresso', async () => {
    await cancelarAporte(USER_A, META_ID, APORTE_ID)

    expect(repo.findMetaAporteById).toHaveBeenCalledWith(tx, USER_A, META_ID, APORTE_ID)
    expect(repo.updateMetaAporteStatus).toHaveBeenCalledWith(
      tx,
      USER_A,
      META_ID,
      APORTE_ID,
      'cancelado',
    )
    expect(repo.updateMetaStatus).toHaveBeenCalled()
  })
})
