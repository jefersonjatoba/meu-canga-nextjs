'use client'

import { useUser } from '@/hooks/useUser'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { LineItem } from '@/components/ui/LineItem'
import { Button } from '@/components/ui/Button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Shield,
  FileText,
  ArrowUpRight,
  CircleDollarSign,
  ShoppingCart,
  Home,
  Car,
  Heart,
} from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const fluxoData = [
  { mes: 'Nov', receita: 4800, despesa: 2900 },
  { mes: 'Dez', receita: 5100, despesa: 3200 },
  { mes: 'Jan', receita: 4600, despesa: 2700 },
  { mes: 'Fev', receita: 5400, despesa: 3100 },
  { mes: 'Mar', receita: 4900, despesa: 2800 },
  { mes: 'Abr', receita: 5200, despesa: 2800 },
]

const receitaData = [
  { categoria: 'Salário', valor: 4500 },
  { categoria: 'RAS', valor: 480 },
  { categoria: 'Extras', valor: 220 },
]

const transactions = [
  {
    id: '1',
    title: 'Salário — PMESP',
    subtitle: 'Crédito em conta',
    amount: 'R$ 4.500,00',
    type: 'credit' as const,
    date: '01/04',
    icon: <CircleDollarSign size={16} />,
    iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    badge: 'Receita',
    badgeVariant: 'success' as const,
  },
  {
    id: '2',
    title: 'Aluguel',
    subtitle: 'Débito automático',
    amount: 'R$ 900,00',
    type: 'debit' as const,
    date: '05/04',
    icon: <Home size={16} />,
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-500',
    badge: 'Moradia',
    badgeVariant: 'error' as const,
  },
  {
    id: '3',
    title: 'RAS — 15/04',
    subtitle: 'Trabalho extra aprovado',
    amount: 'R$ 480,00',
    type: 'credit' as const,
    date: '15/04',
    icon: <Shield size={16} />,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-500',
    badge: 'RAS',
    badgeVariant: 'primary' as const,
  },
  {
    id: '4',
    title: 'Mercado',
    subtitle: 'Compra mensal',
    amount: 'R$ 420,00',
    type: 'debit' as const,
    date: '18/04',
    icon: <ShoppingCart size={16} />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    badge: 'Alimentação',
    badgeVariant: 'warning' as const,
  },
  {
    id: '5',
    title: 'Combustível',
    subtitle: 'Posto Shell',
    amount: 'R$ 180,00',
    type: 'debit' as const,
    date: '20/04',
    icon: <Car size={16} />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
    badge: 'Transporte',
    badgeVariant: 'primary' as const,
  },
]

const metas = [
  { label: 'Reserva de emergência (6x salário)', current: 18000, target: 27000, variant: 'success' as const },
  { label: 'Entrada do apartamento', current: 32000, target: 80000, variant: 'info' as const },
  { label: 'Viagem de férias', current: 3200, target: 6000, variant: 'warning' as const },
]

const scoreColor = (score: number) =>
  score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error'

const scoreBg = (score: number) =>
  score >= 80 ? 'bg-green-50 dark:bg-green-900/20' : score >= 60 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'

const financialHealthScore = 74

const chartTooltipStyle = {
  backgroundColor: '#1E1E1E',
  border: '1px solid #3A3A3A',
  borderRadius: '8px',
  color: '#F9FAFB',
  fontSize: '12px',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser()

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div className="space-y-6">
      {/* ── Header greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
            Bom dia, {user?.name ?? 'policial'}.
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Aqui está o resumo das suas finanças em Abril 2026.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>
            Lançamento
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Shield size={14} />}>
            Nova RAS
          </Button>
          <Button variant="outline" size="sm" leftIcon={<FileText size={14} />}>
            Relatório
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Total"
          value="R$ 12.500"
          subtext="vs. mês anterior"
          trend={2.5}
          accentColor="green"
          icon={<Wallet size={18} />}
        />
        <StatCard
          title="Receita (Abril)"
          value="R$ 5.200"
          subtext="Salário + RAS + extras"
          trend={6.1}
          accentColor="blue"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          title="Despesa (Abril)"
          value="R$ 2.800"
          subtext="vs. R$ 3.100 (Mar)"
          trend={-9.7}
          accentColor="red"
          icon={<TrendingDown size={18} />}
        />
        <StatCard
          title="Patrimônio Investido"
          value="R$ 53.800"
          subtext="em 30 dias"
          trend={5.2}
          accentColor="purple"
          icon={<PiggyBank size={18} />}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Line chart — 3/5 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Fluxo Financeiro</CardTitle>
            <CardDescription>Receita vs. Despesa — últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={fluxoData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v) => [
                    `R$ ${(v as number).toLocaleString('pt-BR')}`,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Receita"
                />
                <Line
                  type="monotone"
                  dataKey="despesa"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Despesa"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart — 2/5 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Composição de Receita</CardTitle>
            <CardDescription>Abril 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={receitaData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                <XAxis
                  dataKey="categoria"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v) => [`R$ ${(v as number).toLocaleString('pt-BR')}`, 'Valor']}
                />
                <Bar
                  dataKey="valor"
                  fill="#3B82F6"
                  radius={[6, 6, 0, 0]}
                  name="Valor"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Transactions + Goals side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent transactions — 3/5 */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimas Transações</CardTitle>
              <CardDescription>5 movimentações recentes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={13} />}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent className="p-0 pt-0">
            {transactions.map((t) => (
              <LineItem
                key={t.id}
                icon={t.icon}
                iconBg={t.iconBg}
                title={t.title}
                subtitle={t.subtitle}
                amount={t.amount}
                amountType={t.type}
                date={t.date}
                badge={t.badge}
                badgeVariant={t.badgeVariant}
              />
            ))}
          </CardContent>
        </Card>

        {/* Goals — 2/5 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Metas Financeiras</CardTitle>
            <CardDescription>Progresso acumulado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {metas.map((meta) => (
              <ProgressBar
                key={meta.label}
                label={meta.label}
                value={meta.current}
                max={meta.target}
                variant={meta.variant}
                showValue
                size="md"
                valueFormat={(v, m) =>
                  `R$ ${v.toLocaleString('pt-BR')} / R$ ${m.toLocaleString('pt-BR')}`
                }
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Financial Health Score ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`sm:col-span-1 ${scoreBg(financialHealthScore)}`}>
          <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Score de Saúde Financeira
            </p>
            <p className={`text-6xl font-black tabular-nums ${scoreColor(financialHealthScore)}`}>
              {financialHealthScore}
            </p>
            <Badge variant="warning" size="md" dot>
              Regular — pode melhorar
            </Badge>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reduza as despesas variáveis em ~15% para atingir &quot;Bom&quot; (80+).
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle>Dicas Rápidas</CardTitle>
            <CardDescription>Baseado no seu perfil financeiro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                icon: Heart,
                color: 'text-red-400',
                tip: 'Sua reserva de emergência está em 67% da meta. Contribua R$ 300/mês para atingi-la em 9 meses.',
              },
              {
                icon: TrendingUp,
                color: 'text-green-400',
                tip: 'Você investe 16% da renda. O recomendado é 20%. Pequeno ajuste de R$ 200/mês já faz diferença.',
              },
              {
                icon: ShoppingCart,
                color: 'text-amber-400',
                tip: 'Gastos com alimentação representam 8% da renda — dentro da faixa ideal (até 15%). Ótimo controle!',
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex gap-3 items-start">
                  <div className={`mt-0.5 shrink-0 ${item.color}`}>
                    <Icon size={16} aria-hidden />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.tip}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
