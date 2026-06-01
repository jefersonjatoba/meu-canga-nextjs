import { unstable_cache } from 'next/cache'
import { currentMonthBR, getDataHojeSP, toISODateBR } from '@/lib/dates'
import { prisma } from '@/lib/prisma'
import type { DashboardSummaryDTO, RecentTransactionItem, RasItem } from '@/features/dashboard/types'
import type { TipoLancamento } from '@/features/lancamentos/types'
import {
  getLancamentosSummaryForUser,
  listLancamentosForUser,
  getPatrimonioAcumulado,
} from '@/server/services/lancamento.service'
import { getCreditCardDashboardSummary } from '@/server/services/cartao.service'

const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/
const RECENT_PAGE_SIZE = 5
const HISTORY_MONTHS = 6

function formatPeriodoLabel(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return date
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(' de ', ' ')
    .replace(/^\w/, (char) => char.toUpperCase())
}

function shiftMonth(competencia: string, offset: number): string {
  const [year, month] = competencia.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + offset, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function buildHistoryMonths(competencia: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftMonth(competencia, index - (count - 1)))
}

async function _getDashboardSummaryForUser(
  userId: string,
  params: { mes?: string },
): Promise<DashboardSummaryDTO> {
  const mes =
    params.mes && COMPETENCIA_REGEX.test(params.mes) ? params.mes : currentMonthBR()

  const historicoMeses = buildHistoryMonths(mes, HISTORY_MONTHS)
  const mesesAnteriores = historicoMeses.filter((competencia) => competencia !== mes)
  const mesAnterior = shiftMonth(mes, -1)

  const [
    summary,
    recentResult,
    cartao,
    rasData,
    proximaEscala,
    rasAReceber,
    patrimonioAcumulado,
    recorrenciasData,
    assinaturasData,
    historicoSummaries,
  ] = await Promise.all([
    getLancamentosSummaryForUser(userId, mes),
    listLancamentosForUser(userId, { mes, pageSize: RECENT_PAGE_SIZE }),
    getCreditCardDashboardSummary(userId),
    getRasDataForDashboard(userId, mes),
    getProximaEscalaForUser(userId),
    getRasAReceberForUser(userId, mes),
    getPatrimonioAcumulado(userId),
    getRecorrenciasDataForDashboard(userId, mes),
    getAssinaturasDataForDashboard(userId, mes),
    Promise.all(
      mesesAnteriores.map(async (competencia) => ({
        competencia,
        summary: await getLancamentosSummaryForUser(userId, competencia),
      })),
    ),
  ])

  const historicoMap = new Map(
    historicoSummaries.map(({ competencia, summary: resumo }) => [competencia, resumo.balance]),
  )

  const historicoSaldos = historicoMeses.map((competencia) => ({
    mes: competencia,
    valor: competencia === mes ? summary.balance : historicoMap.get(competencia) ?? 0,
  }))

  const lancamentosRecentes: RecentTransactionItem[] = recentResult.items.map((lancamento) => ({
    id: lancamento.id,
    descricao: lancamento.descricao,
    tipo: lancamento.tipo as TipoLancamento,
    categoria: lancamento.categoria,
    valorCentavos: lancamento.valorCentavos,
    data: lancamento.data,
    status: lancamento.status,
    conta: lancamento.conta ?? null,
  }))

  return {
    periodo: mes,
    periodoLabel: formatPeriodoLabel(mes),
    saldoOperacionalCentavos: summary.balance,
    saldoAnteriorCentavos: historicoMap.get(mesAnterior) ?? 0,
    historicoSaldos,
    totalReceitasCentavos: summary.totalIncome,
    totalDespesasCentavos: summary.totalExpense,
    totalRasCentavos: summary.totalRas,
    totalAportesCentavos: summary.totalAportes,
    totalResgatesCentavos: summary.totalResgates,
    patrimonioInvestidoCentavos: patrimonioAcumulado.totalAportes - patrimonioAcumulado.totalResgates,
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
    recorrenciasVencidasCount: recorrenciasData.vencidasCount,
    recorrenciasPrevistasMesCentavos: recorrenciasData.previstasMesCentavos,
    assinaturasVencidasCount: assinaturasData.vencidasCount,
    assinaturasPrevistasMesCentavos: assinaturasData.previstasMesCentavos,
  }
}

// Versão cacheada: 60s por usuário+mês — evita 35-50 queries repetidas
export function getDashboardSummaryForUser(
  userId: string,
  params: { mes?: string },
): Promise<DashboardSummaryDTO> {
  const mes = params.mes && COMPETENCIA_REGEX.test(params.mes) ? params.mes : currentMonthBR()
  return unstable_cache(
    () => _getDashboardSummaryForUser(userId, { mes }),
    ['dashboard-summary', userId, mes],
    { revalidate: 60, tags: [`dashboard-${userId}`] },
  )()
}

async function getRasDataForDashboard(
  userId: string,
  competencia: string,
): Promise<{ horasMes: number; proximosRas: RasItem[] }> {
  const [horasResult, proximosResult] = await Promise.all([
    prisma.rasAgenda.aggregate({
      where: {
        userId,
        competencia,
        status: { notIn: ['cancelado'] },
        deletadoEm: null,
      },
      _sum: { duracao: true },
    }),
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
  const proximosRas: RasItem[] = proximosResult.map((ras) => ({
    data: (ras.data as Date).toISOString().split('T')[0]!,
    horaInicio: ras.horaInicio,
    local: ras.local,
    duracao: ras.duracao,
    status: ras.status,
  }))

  return { horasMes, proximosRas }
}

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

  const escalas = await prisma.escala.findMany({
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

  const proximaEscala = escalas.find((escala) => toISODateBR(escala.dataEscala) >= hoje)
  if (!proximaEscala) return null

  const dataISO = toISODateBR(proximaEscala.dataEscala)
  const hojeDate = new Date(`${hoje}T00:00:00Z`)
  const dataDate = new Date(`${dataISO}T00:00:00Z`)
  const diasAte = Math.round((dataDate.getTime() - hojeDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    data: dataISO,
    horaInicio: proximaEscala.horaInicio,
    horaFim: proximaEscala.horaFim,
    tipoTurno: proximaEscala.tipoTurno,
    localServico: proximaEscala.localServico,
    diasAte,
  }
}

async function getRasAReceberForUser(
  userId: string,
  competencia: string,
): Promise<{
  valor: number
  horas: number
  horasConfirmadas: number
}> {
  const mesAnterior = shiftMonth(competencia, -1)

  const rasResult = await prisma.rasAgenda.findMany({
    where: {
      userId,
      deletadoEm: null,
      status: 'confirmado',
      competencia: mesAnterior,
    },
    select: {
      duracao: true,
      valorCentavos: true,
      pagamentos: {
        select: {
          valorCentavos: true,
        },
      },
    },
  })

  let valor = 0
  let horas = 0

  for (const ras of rasResult) {
    const pagoCentavos = ras.pagamentos.reduce((sum, pagamento) => sum + pagamento.valorCentavos, 0)
    const saldoPendente = Math.max(ras.valorCentavos - pagoCentavos, 0)

    if (saldoPendente > 0) {
      valor += saldoPendente
      horas += ras.duracao
    }
  }

  return { valor, horas, horasConfirmadas: horas }
}

async function getRecorrenciasDataForDashboard(
  userId: string,
  mes: string,
): Promise<{ vencidasCount: number; previstasMesCentavos: number }> {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const inicioMes = new Date(`${mes}-01T00:00:00Z`)
  const fimMes = new Date(inicioMes)
  fimMes.setUTCMonth(fimMes.getUTCMonth() + 1)

  const recorrencias = await prisma.recorrencia.findMany({
    where: { userId, ativa: true },
    select: { proximaExecucao: true, valorCentavos: true },
  })

  let vencidasCount = 0
  let previstasMesCentavos = 0

  for (const recorrencia of recorrencias) {
    if (!recorrencia.proximaExecucao) continue

    const dataStr = toISODateBR(recorrencia.proximaExecucao as Date)
    if (dataStr < hoje) vencidasCount++

    const dataProximaExecucao = new Date(recorrencia.proximaExecucao as Date)
    if (dataProximaExecucao >= inicioMes && dataProximaExecucao < fimMes) {
      previstasMesCentavos += recorrencia.valorCentavos
    }
  }

  return { vencidasCount, previstasMesCentavos }
}

async function getAssinaturasDataForDashboard(
  userId: string,
  mes: string,
): Promise<{ vencidasCount: number; previstasMesCentavos: number }> {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const inicioMes = new Date(`${mes}-01T00:00:00Z`)
  const fimMes = new Date(inicioMes)
  fimMes.setUTCMonth(fimMes.getUTCMonth() + 1)

  const assinaturas = await prisma.assinaturaCartao.findMany({
    where: { userId, ativa: true },
    select: { proximaCobranca: true, valorCentavos: true },
  })

  let vencidasCount = 0
  let previstasMesCentavos = 0

  for (const assinatura of assinaturas) {
    if (!assinatura.proximaCobranca) continue

    const dataStr = toISODateBR(assinatura.proximaCobranca as Date)
    if (dataStr < hoje) vencidasCount++

    const dataProximaCobranca = new Date(assinatura.proximaCobranca as Date)
    if (dataProximaCobranca >= inicioMes && dataProximaCobranca < fimMes) {
      previstasMesCentavos += assinatura.valorCentavos
    }
  }

  return { vencidasCount, previstasMesCentavos }
}
