'use client'

import { useState, useEffect } from 'react'
import type { RecursoKey, LimiteKey } from '@/lib/plans'

interface PlanData {
  plan: 'free' | 'pro'
  isPro: boolean
  planExpiresAt: string | null
  limites: Record<LimiteKey, number>
  recursos: Record<RecursoKey, boolean>
}

interface UsePlanReturn {
  loading: boolean
  plan: 'free' | 'pro'
  isPro: boolean
  planExpiresAt: string | null
  canUse: (recurso: RecursoKey) => boolean
  getLimite: (chave: LimiteKey) => number
}

const DEFAULT: PlanData = {
  plan: 'free',
  isPro: false,
  planExpiresAt: null,
  limites: {
    lancamentos_mes: 10,
    ras_mes: 4,
    metas: 1,
    recorrencias: 2,
    contas: 3,
    pdf_mes: 1,
  },
  recursos: {
    investimentos: false,
    agente_ia: false,
    base_juridica: false,
    visao_anual: false,
    exportar_csv: false,
    notificacoes_push: false,
    cotacoes_tempo_real: false,
  },
}

export function usePlan(): UsePlanReturn {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PlanData>(DEFAULT)

  useEffect(() => {
    fetch('/api/plan')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data as PlanData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return {
    loading,
    plan: data.plan,
    isPro: data.isPro,
    planExpiresAt: data.planExpiresAt,
    canUse: (recurso) => data.recursos[recurso],
    getLimite: (chave) => data.limites[chave],
  }
}
