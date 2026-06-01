'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CotacaoDTO {
  ticker:             string
  nome:               string | null
  precoCentavos:      number
  fechamentoCentavos: number | null
  variacaoPercent:    number | null
  atualizadoEm:       string
}

export type CotacoesMap = Record<string, CotacaoDTO>

// ─── Constantes ───────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

// Tipos que têm cotação em bolsa (B3 / cripto)
export const TIPOS_COM_COTACAO = ['acao', 'fii', 'etf', 'bdr', 'cripto'] as const
export type TipoComCotacao = typeof TIPOS_COM_COTACAO[number]

export function temCotacao(tipo: string): boolean {
  return (TIPOS_COM_COTACAO as readonly string[]).includes(tipo)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Busca cotações para os tickers fornecidos, com cache de 5 min no servidor.
// Repete a busca automaticamente a cada 5 min enquanto o componente estiver montado.

export function useCotacoes(tickers: string[]) {
  const [cotacoes, setCotacoes] = useState<CotacoesMap>({})
  const [error, setError]       = useState<string | null>(null)

  // Normaliza e filtra tickers vazios — estabiliza a referência para o useEffect
  const tickersKey = tickers
    .map(t => t.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join(',')

  // Inicia como true se há tickers — evita o flash de "não encontrada" antes da 1ª busca
  const [loading, setLoading] = useState(() => tickersKey.length > 0)

  const abortRef = useRef<AbortController | null>(null)

  const fetchCotacoes = useCallback(async () => {
    if (!tickersKey) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const res  = await fetch(`/api/cotacoes?tickers=${encodeURIComponent(tickersKey)}`, {
        signal: controller.signal,
      })
      const body = await res.json() as { success: boolean; data?: CotacoesMap; error?: string }

      if (!controller.signal.aborted) {
        if (body.success && body.data) {
          setCotacoes(body.data)
        } else {
          setError(body.error ?? 'Erro ao buscar cotações')
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setError('Sem conexão com o servidor de cotações')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [tickersKey])

  useEffect(() => {
    if (!tickersKey) {
      const timer = window.setTimeout(() => {
        setLoading(false)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    // Mostra spinner imediatamente ao trocar de ticker
    const timer = window.setTimeout(() => {
      setLoading(true)
    }, 0)
    const initialFetchTimer = window.setTimeout(() => {
      void fetchCotacoes()
    }, 0)
    const interval = setInterval(fetchCotacoes, REFRESH_INTERVAL_MS)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(initialFetchTimer)
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [fetchCotacoes, tickersKey])

  return { cotacoes, loading, error, refresh: fetchCotacoes }
}

// ─── Hook para um único ativo ─────────────────────────────────────────────────

export function useCotacao(ticker: string | null) {
  const tickers = ticker ? [ticker] : []
  const { cotacoes, loading, error, refresh } = useCotacoes(tickers)
  const cotacao = ticker ? (cotacoes[ticker.toUpperCase()] ?? null) : null
  return { cotacao, loading, error, refresh }
}
