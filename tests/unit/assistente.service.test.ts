import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/services/dashboard.service', () => ({
  getDashboardSummaryForUser: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    conta: { findMany: vi.fn() },
    meta: { findMany: vi.fn() },
    recorrencia: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import * as dashboardService from '@/server/services/dashboard.service'
import { buildFinancialAssistantContext, normalizeChatHistory } from '@/server/services/assistente.service'

const mockSummary = vi.mocked(dashboardService.getDashboardSummaryForUser)

beforeEach(() => {
  vi.clearAllMocks()
  mockSummary.mockResolvedValue({
    periodo: '2026-05',
    periodoLabel: 'Maio 2026',
    saldoOperacionalCentavos: 250000,
    saldoAnteriorCentavos: 200000,
    historicoSaldos: [],
    totalReceitasCentavos: 500000,
    totalDespesasCentavos: 250000,
    totalRasCentavos: 90000,
    totalAportesCentavos: 0,
    totalResgatesCentavos: 0,
    patrimonioInvestidoCentavos: 450000,
    taxaPoupancaPercentual: 20,
    lancamentosRecentes: [
      {
        id: 'l1',
        descricao: 'Salário',
        tipo: 'income',
        categoria: 'Salário',
        valorCentavos: 500000,
        data: '2026-05-05',
        status: 'confirmada',
        conta: null,
      },
    ],
    hasLancamentos: true,
    cartao: {
      totalCartoes: 1,
      totalLimiteCentavos: 1000000,
      limiteUsadoCentavos: 220000,
      limiteDisponivelCentavos: 780000,
      totalFaturasAbertas: 1,
      valorFaturasAbertasCentavos: 220000,
      proximaFatura: {
        id: 'fat_1',
        contaId: 'card_1',
        contaNome: 'Nubank',
        competencia: '2026-05',
        dataVencimento: new Date('2026-05-28T00:00:00Z'),
        status: 'aberta',
        totalCentavos: 220000,
      },
      faturasProximas: [],
    },
    totalRasHoras: 24,
    proximosRas: [
      { data: '2026-05-20', horaInicio: '08:00', local: 'Centro', duracao: 12, status: 'agendado' },
    ],
    rasAReceberCentavos: 45000,
    rasHorasPendentes: 0,
    rasHorasConfirmadas: 12,
    proximaEscala: {
      data: '2026-05-18',
      horaInicio: '07:00',
      horaFim: '19:00',
      tipoTurno: 'plantao',
      localServico: 'Batalhão Central',
      diasAte: 3,
    },
    recorrenciasVencidasCount: 1,
    recorrenciasPrevistasMesCentavos: 180000,
    assinaturasVencidasCount: 0,
    assinaturasPrevistasMesCentavos: 7000,
  } as never)

  vi.mocked(prisma.conta.findMany).mockResolvedValue([
    {
      nome: 'Conta Principal',
      tipo: 'checking',
      saldoCentavos: 250000,
      limiteCentavos: null,
      diaFechamento: null,
      diaVencimento: null,
    },
    {
      nome: 'Nubank',
      tipo: 'credit',
      saldoCentavos: 0,
      limiteCentavos: 1000000,
      diaFechamento: 20,
      diaVencimento: 28,
    },
  ] as never)

  vi.mocked(prisma.meta.findMany).mockResolvedValue([
    {
      descricao: 'Apartamento',
      valorAlvoCentavos: 12000000,
      valorAtualCentavos: 3000000,
      dataAlvo: new Date('2030-05-01T00:00:00Z'),
    },
  ] as never)

  vi.mocked(prisma.recorrencia.findMany).mockResolvedValue([
    {
      descricao: 'Aluguel',
      tipo: 'expense',
      valorCentavos: 180000,
      frequencia: 'MENSAL',
      diaVencimento: 10,
      proximaExecucao: new Date('2026-05-10T00:00:00Z'),
    },
  ] as never)
})

describe('normalizeChatHistory', () => {
  it('mantém apenas histórico válido e junta papéis consecutivos', () => {
    const result = normalizeChatHistory([
      { role: 'user', content: '  Como estou?  ' },
      { role: 'user', content: 'E o cartão?' },
      { role: 'assistant', content: 'Você está bem.' },
    ])

    expect(result).toEqual([
      { role: 'user', content: 'Como estou?\n\nE o cartão?' },
      { role: 'assistant', content: 'Você está bem.' },
    ])
  })
})

describe('buildFinancialAssistantContext', () => {
  it('monta um contexto financeiro com saldo, cartão, metas, recorrências e rotina', async () => {
    const context = await buildFinancialAssistantContext('user_1', '2026-05')

    expect(mockSummary).toHaveBeenCalledWith('user_1', { mes: '2026-05' })
    expect(context).toContain('Saldo operacional: R$ 2.500,00')
    expect(context).toContain('Cartão - limite disponível: R$ 7.800,00')
    expect(context).toContain('Metas ativas:')
    expect(context).toContain('Apartamento')
    expect(context).toContain('Recorrências ativas:')
    expect(context).toContain('Aluguel')
    expect(context).toContain('Próxima escala: 2026-05-18 às 07:00')
    expect(context).toContain('Próximos RAS:')
  })
})
