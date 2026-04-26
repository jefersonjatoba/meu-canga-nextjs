import { formatBRL } from '@/lib/money'
import { TrendingUp, TrendingDown, Shield, PiggyBank, Percent } from 'lucide-react'
import { MetricCard } from './MetricCard'
import type { MetricCardTone } from './MetricCard'
import type { DashboardSummaryDTO } from '@/features/dashboard/types'

type Props = Pick<
  DashboardSummaryDTO,
  | 'totalReceitasCentavos'
  | 'totalDespesasCentavos'
  | 'totalRasCentavos'
  | 'patrimonioInvestidoCentavos'
  | 'taxaPoupancaPercentual'
>

function savingsTone(rate: number): MetricCardTone {
  if (rate >= 20) return 'positive'
  if (rate >= 10) return 'warning'
  return 'neutral'
}

export function CashflowCards({
  totalReceitasCentavos,
  totalDespesasCentavos,
  totalRasCentavos,
  patrimonioInvestidoCentavos,
  taxaPoupancaPercentual,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      <MetricCard
        title="Receitas"
        value={formatBRL(totalReceitasCentavos)}
        tone="positive"
        icon={<TrendingUp size={16} />}
      />
      <MetricCard
        title="Despesas"
        value={formatBRL(totalDespesasCentavos)}
        tone="negative"
        icon={<TrendingDown size={16} />}
      />
      <MetricCard
        title="RAS"
        value={formatBRL(totalRasCentavos)}
        description="Sobreaviso no período"
        tone="info"
        icon={<Shield size={16} />}
      />
      <MetricCard
        title="Patrimônio"
        value={formatBRL(patrimonioInvestidoCentavos)}
        description="Aportes − resgates"
        tone="info"
        icon={<PiggyBank size={16} />}
      />
      <MetricCard
        title="Taxa de Poupança"
        value={`${taxaPoupancaPercentual.toFixed(1)}%`}
        description="% da receita poupada"
        tone={savingsTone(taxaPoupancaPercentual)}
        icon={<Percent size={16} />}
      />
    </div>
  )
}
