'use client'

import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const mockChartData = [
  { mes: 'Jan', receita: 3000, despesa: 2400 },
  { mes: 'Fev', receita: 3500, despesa: 2600 },
  { mes: 'Mar', receita: 4200, despesa: 2800 },
  { mes: 'Abr', receita: 3800, despesa: 2500 },
]

export default function DashboardPage() {
  const { user } = useUser()

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold text-precision-black dark:text-light-gray mb-2">
          Bem-vindo, {user?.name}! 👋
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Aqui está um resumo do seu mês financeiro
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent-green">R$ 12.500,00</p>
            <p className="text-xs text-gray-500 mt-1">+2.5% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Receita (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">R$ 5.200,00</p>
            <p className="text-xs text-gray-500 mt-1">Salário + RAS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Despesa (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-error">R$ 2.800,00</p>
            <p className="text-xs text-gray-500 mt-1">Fixa + variável</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-accent-blue">R$ 8.300,00</p>
            <p className="text-xs text-gray-500 mt-1">+5.2% em 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo Financeiro (últimos 4 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="receita"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Receita"
                />
                <Line
                  type="monotone"
                  dataKey="despesa"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Despesa"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composição de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { categoria: 'Salário', valor: 4500 },
                { categoria: 'RAS', valor: 700 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                <Bar dataKey="valor" fill="#3B82F6" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-gray transition-colors text-center">
              <p className="font-semibold text-sm">+ Lançamento</p>
            </button>
            <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-gray transition-colors text-center">
              <p className="font-semibold text-sm">+ RAS</p>
            </button>
            <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-gray transition-colors text-center">
              <p className="font-semibold text-sm">+ Investimento</p>
            </button>
            <button className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-gray transition-colors text-center">
              <p className="font-semibold text-sm">Relatório</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
