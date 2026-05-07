// Dashboard Service — composes lancamento service data into a single dashboard DTO.
// Rules:
//   1. userId always comes from session — never from client.
//   2. No formatting (BRL, dates) — return centavos and raw values.
//   3. No Prisma access directly — go through lancamento.service.

import { currentMonthBR, getDataHojeSP, toISODateBR } from '@/lib/dates'
import {
  getLancamentosSummaryForUser,
  listLancamentosForUser,
} from '@/server/services/lancamento.service'
import { getCreditCardDashboardSummary } from '@/server/services/cartao.service'
import { prisma } from '@/lib/prisma'
import type { DashboardSummaryDTO, RecentTransactionItem, RasItem } from '@/features/dashboard/types'
import type { TipoLancamento } from '@/features/lancamentos/types'

// Helper: subtract one month from YYYY-MM format
function getPreviousMonth(competencia: string): string {
  const [year, month] = competencia.split('-').map(Number)
  if (month === 1) {
    return `${year - 1}-12`
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/
const RECENT_PAGE_SIZE = 5

function formatPeriodoLabel(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  // "abril de 2026" → "Abril 2026"
  return date
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

export async function getDashboardSummaryForUser(
  userId: string,
  params: { mes?: string },
): Promise<DashboardSummaryDTO> {
  const mes =
    params.mes && COMPETENCIA_REGEX.test(params.mes) ? params.mes : currentMonthBR()

  const [summary, recentResult, cartao, rasData, proximaEscala, rasAReceber] = await Promise.all([
    getLancamentosSummaryForUser(userId, mes),
    listLancamentosForUser(userId, { mes, pageSize: RECENT_PAGE_SIZE }),
    getCreditCardDashboardSummary(userId),
    getRasDataForDashboard(userId, mes),
    getProximaEscalaForUser(userId),
    getRasAReceberForUser(userId, mes),
  ])

  const lancamentosRecentes: RecentTransactionItem[] = recentResult.items.map(l => ({
    id: l.id,
    descricao: l.descricao,
    tipo: l.tipo as TipoLancamento,
    categoria: l.categoria,
    valorCentavos: l.valorCentavos,
    data: l.data,
    status: l.status,
    conta: l.conta ?? null,
  }))

  return {
    periodo: mes,
    periodoLabel: formatPeriodoLabel(mes),
    saldoOperacionalCentavos: summary.balance,
    totalReceitasCentavos: summary.totalIncome,
    totalDespesasCentavos: summary.totalExpense,
    totalRasCentavos: summary.totalRas,
    totalAportesCentavos: summary.totalAportes,
    totalResgatesCentavos: summary.totalResgates,
    patrimonioInvestidoCentavos: summary.totalAportes - summary.totalResgates,
    taxaPoupancaPercentual: summary.savingsRate,
    lancamentosRecentes,
    hasLancamentos: recentResult.total > 0,
    cartao,
    totalRasHoras: rasData.horasMes,
    proximosRas: rasData.proximosRas,
    rasAReceberCentavos: rasAReceber.valor,
    rasHorasPendentes: rasAReceber.horas,
    rasHorasConfirmadas: rasAReceber.horasConfirmadas,
    proximaEscala,
  }
}

// Helper para buscar dados de RAS
async function getRasDataForDashboard(
  userId: string,
  competencia: string,
): Promise<{ horasMes: number; proximosRas: RasItem[] }> {
  const [horasResult, proximosResult] = await Promise.all([
    // Total de horas RAS do mês (agendado/realizado)
    prisma.rasAgenda.aggregate({
      where: {
        userId,
        competencia,
        status: { notIn: ['cancelado'] },
        deletadoEm: null,
      },
      _sum: { duracao: true },
    }),
    // Próximos 3 RAS agendados
    prisma.rasAgenda.findMany({
      where: {
        userId,
        status: 'agendado',
        deletadoEm: null,
        data: { gte: new Date() },
      },
      orderBy: { data: 'asc' },
      take: 3,
      select: {
        data: true,
        horaInicio: true,
        local: true,
        duracao: true,
        status: true,
      },
    }),
  ])

  const horasMes = horasResult._sum.duracao ?? 0

  const proximosRas: RasItem[] = proximosResult.map(r => {
    const dataISO = (r.data as Date).toISOString().split('T')[0]
    return {
      data: dataISO,
      horaInicio: r.horaInicio,
      local: r.local,
      duracao: r.duracao,
      status: r.status,
    }
  })

  return { horasMes, proximosRas }
}

// Helper para buscar próxima escala agendada
async function getProximaEscalaForUser(userId: string): Promise<{
  data: string
  horaInicio: string
  horaFim: string
  tipoTurno: string
  localServico: string | null
  diasAte: number
} | null> {
  const hoje = getDataHojeSP()
  const [anoAtual, mesAtual] = hoje.slice(0, 7).split('-').map(Number)

  // Fetch escalas from current month onwards (same scope as /dashboard/escala page)
  // to ensure consistency with diasAteProximo() which works on monthly data
  const todasAsEscalas = await prisma.escala.findMany({
    where: {
      userId,
      status: 'agendada',
      dataEscala: {
        gte: new Date(anoAtual, mesAtual - 1, 1),
      },
    },
    orderBy: { dataEscala: 'asc' },
    select: {
      dataEscala: true,
      horaInicio: true,
      horaFim: true,
      tipoTurno: true,
      localServico: true,
    },
    take: 20,
  })

  // Filter: keep only escalas >= today (string comparison of YYYY-MM-DD, same as diasAteProximo)
  const proximaEscalaObj = todasAsEscalas.find(e => {
    const dataISO = toISODateBR(e.dataEscala)
    return dataISO >= hoje
  })

  if (!proximaEscalaObj) return null

  const dataISO = toISODateBR(proximaEscalaObj.dataEscala)
  const hojeDate = new Date(`${hoje}T00:00:00Z`)
  const dataDate = new Date(`${dataISO}T00:00:00Z`)

  const diasAte = Math.round((dataDate.getTime() - hojeDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    data: dataISO,
    horaInicio: proximaEscalaObj.horaInicio,
    horaFim: proximaEscalaObj.horaFim,
    tipoTurno: proximaEscalaObj.tipoTurno,
    localServico: proximaEscalaObj.localServico,
    diasAte,
  }
}

// Helper para calcular RAS a receber (RAS realizados do mês anterior que entram na conta agora)
// O policial marca como realizado (confirmação) e no próximo mês recebe o pagamento
// Ex: RAS realizado em abril → recebido em maio
async function getRasAReceberForUser(userId: string, competencia: string): Promise<{
  valor: number
  horas: number
  horasConfirmadas: number
}> {
  // RAS realizados do mês anterior (que serão pagos neste mês)
  const mesAnterior = getPreviousMonth(competencia)

  const rasResult = await prisma.rasAgenda.findMany({
    where: {
      userId,
      deletadoEm: null,
      status: 'realizado', // RAS marcado como realizado (confirmação feita ao clicar botão)
      competencia: mesAnterior, // Busca pelo mês anterior
    },
    select: {
      duracao: true,
      valorCentavos: true,
    },
  })

  const valor = rasResult.reduce((sum, r) => sum + r.valorCentavos, 0)
  const horas = rasResult.reduce((sum, r) => sum + r.duracao, 0)

  return { valor, horas, horasConfirmadas: horas }
}
