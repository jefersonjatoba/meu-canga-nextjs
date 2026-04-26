import { formatBRL } from '@/lib/money'
import { MetricCard } from './MetricCard'
import type { MetricCardTone } from './MetricCard'
import type { DashboardSummaryDTO } from '@/features/dashboard/types'

type Props = Pick<
  DashboardSummaryDTO,
  | 'saldoOperacionalCentavos'
  | 'totalReceitasCentavos'
  | 'totalDespesasCentavos'
  | 'patrimonioInvestidoCentavos'
  | 'taxaPoupancaPercentual'
>

function balanceTone(centavos: number): MetricCardTone {
  if (centavos > 0) return 'positive'
  if (centavos < 0) return 'negative'
  return 'neutral'
}

function savingsTone(rate: number): MetricCardTone {
  if (rate >= 20) return 'positive'
  if (rate >= 10) return 'warning'
  return 'neutral'
}

export function CashflowCards({
  saldoOperacionalCentavos,
  totalReceitasCentavos,
  totalDespesasCentavos,
  patrimonioInvestidoCentavos,
  taxaPoupancaPercentual,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <MetricCard
        title="Saldo Operacional"
        value={formatBRL(saldoOperacionalCentavos)}
        description="Receitas − Despesas − Aportes + Resgates"
        tone={balanceTone(saldoOperacionalCentavos)}
      />
      <MetricCard
        title="Receitas"
        value={formatBRL(totalReceitasCentavos)}
        tone="positive"
      />
      <MetricCard
        title="Despesas"
        value={formatBRL(totalDespesasCentavos)}
        tone="negative"
      />
      <MetricCard
        title="Patrimônio Investido"
        value={formatBRL(patrimonioInvestidoCentavos)}
        tone="info"
      />
      <MetricCard
        title="Taxa de Poupança"
        value={`${taxaPoupancaPercentual.toFixed(1)}%`}
        description="% da receita operacional poupada"
        tone={savingsTone(taxaPoupancaPercentual)}
      />
    </div>
  )
}
