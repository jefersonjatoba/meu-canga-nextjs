'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card'

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-precision-black dark:text-light-gray mb-2">
          Configurações
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie suas preferências
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
