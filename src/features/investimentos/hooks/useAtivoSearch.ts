'use client'

import { useEffect, useRef, useState } from 'react'

export interface AtivoSugestao {
  ticker: string
  nome:   string
  tipo:   string
  setor:  string | null
}

// Lista estática de criptos principais (Brapi não cobre cripto de forma confiável)
const CRIPTOS_ESTATICAS: AtivoSugestao[] = [
  { ticker: 'BTC',  nome: 'Bitcoin',       tipo: 'cripto', setor: null },
  { ticker: 'ETH',  nome: 'Ethereum',      tipo: 'cripto', setor: null },
  { ticker: 'BNB',  nome: 'BNB',           tipo: 'cripto', setor: null },
  { ticker: 'SOL',  nome: 'Solana',        tipo: 'cripto', setor: null },
  { ticker: 'XRP',  nome: 'Ripple (XRP)',  tipo: 'cripto', setor: null },
  { ticker: 'ADA',  nome: 'Cardano',       tipo: 'cripto', setor: null },
  { ticker: 'AVAX', nome: 'Avalanche',     tipo: 'cripto', setor: null },
  { ticker: 'DOT',  nome: 'Polkadot',      tipo: 'cripto', setor: null },
  { ticker: 'MATIC',nome: 'Polygon',       tipo: 'cripto', setor: null },
  { ticker: 'LINK', nome: 'Chainlink',     tipo: 'cripto', setor: null },
  { ticker: 'DOGE', nome: 'Dogecoin',      tipo: 'cripto', setor: null },
  { ticker: 'LTC',  nome: 'Litecoin',      tipo: 'cripto', setor: null },
  { ticker: 'ATOM', nome: 'Cosmos',        tipo: 'cripto', setor: null },
  { ticker: 'UNI',  nome: 'Uniswap',       tipo: 'cripto', setor: null },
  { ticker: 'PEPE', nome: 'Pepe',          tipo: 'cripto', setor: null },
]

function buscarCriptos(q: string): AtivoSugestao[] {
  const q2 = q.toLowerCase()
  return CRIPTOS_ESTATICAS.filter(
    c => c.ticker.toLowerCase().includes(q2) || c.nome.toLowerCase().includes(q2),
  ).slice(0, 10)
}

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

export function useAtivoSearch(query: string, tipo: string) {
  const [sugestoes, setSugestoes] = useState<AtivoSugestao[]>([])
  const [buscando, setBuscando]   = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef    = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = query.trim()

    // Cripto: busca local, sem API
    if (tipo === 'cripto') {
      const timer = window.setTimeout(() => {
        setSugestoes(q.length >= 1 ? buscarCriptos(q) : [])
      }, 0)
      return () => window.clearTimeout(timer)
    }

    // Renda fixa / fundo / outro: sem sugestão por ticker
    if (['renda_fixa', 'fundo', 'outro'].includes(tipo)) {
      const timer = window.setTimeout(() => {
        setSugestoes([])
      }, 0)
      return () => window.clearTimeout(timer)
    }

    if (q.length < 2) {
      const timer = window.setTimeout(() => {
        setSugestoes([])
      }, 0)
      return () => window.clearTimeout(timer)
    }

    // Limpa debounce anterior
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort()
      const controller  = new AbortController()
      abortRef.current  = controller

      setBuscando(true)
      try {
        const qs  = new URLSearchParams({ q, tipo })
        const res = await fetch(`/api/cotacoes/busca?${qs}`, { signal: controller.signal })
        const body: ApiResponse<AtivoSugestao[]> = await res.json()

        if (!controller.signal.aborted && body.success) {
          setSugestoes(body.data)
        }
      } catch {
        // AbortError ou falha de rede — ignora silenciosamente
      } finally {
        if (!controller.signal.aborted) setBuscando(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, tipo])

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return { sugestoes, buscando }
}
