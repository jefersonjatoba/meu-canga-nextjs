// Dashboard Service — composes lancamento service data into a single dashboard DTO.
// Rules:
//   1. userId always comes from session — never from client.
//   2. No formatting (BRL, dates) — return centavos and raw values.
//   3. No Prisma access directly — go through lancamento.service.

import { currentMonthBR } from '@/lib/dates'
import {
  getLancamentosSummaryForUser,
  listLancamentosForUser,
} from '@/server/services/lancamento.service'
import type { DashboardSummaryDTO, RecentTransactionItem } from '@/features/dashboard/types'
import type { TipoLancamento } from '@/features/lancamentos/types'

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

  const [summary, recentResult] = await Promise.all([
    getLancamentosSummaryForUser(userId, mes),
    listLancamentosForUser(userId, { mes, pageSize: RECENT_PAGE_SIZE }),
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
    // Phase 3: monthly contribution only — full historical patrimônio in Phase 4
    patrimonioInvestidoCentavos: summary.totalAportes - summary.totalResgates,
    taxaPoupancaPercentual: summary.savingsRate,
    lancamentosRecentes,
    hasLancamentos: recentResult.total > 0,
  }
}
