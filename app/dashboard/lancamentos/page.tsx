'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'

export default function LancamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-precision-black dark:text-light-gray mb-2">
          Lançamentos
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas transações financeiras
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
