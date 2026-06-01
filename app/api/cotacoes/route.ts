import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// ─── Configuração ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos
const MAX_TICKERS  = 20
const YAHOO_BASE   = 'https://query1.finance.yahoo.com/v8/finance/chart'

// Cripto com sufixo -USD; demais ativos B3 com sufixo .SA
const CRIPTO_SYMBOLS = new Set([
  'BTC','ETH','BNB','SOL','XRP','ADA','AVAX','DOT','MATIC','LINK',
  'DOGE','LTC','ATOM','UNI','PEPE','NEAR','ARB','OP','SUI','APT',
])

// ─── Conversão ticker ↔ Yahoo symbol ─────────────────────────────────────────

function toYahoo(ticker: string): string {
  return CRIPTO_SYMBOLS.has(ticker) ? `${ticker}-USD` : `${ticker}.SA`
}

function fromYahoo(yahooSymbol: string): string {
  if (yahooSymbol.endsWith('-USD')) return yahooSymbol.slice(0, -4)
  if (yahooSymbol.endsWith('.SA'))  return yahooSymbol.slice(0, -3)
  return yahooSymbol
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface YahooMeta {
  symbol:               string
  shortName?:           string
  longName?:            string
  regularMarketPrice?:  number
  chartPreviousClose?:  number
}

interface YahooChartResponse {
  chart?: { result?: { meta: YahooMeta }[]; error?: unknown }
}

// ─── Busca um ticker no Yahoo Finance ────────────────────────────────────────

async function fetchOneTicker(ticker: string): Promise<{ ticker: string; meta: YahooMeta } | null> {
  const url = `${YAHOO_BASE}/${toYahoo(ticker)}?interval=1d&range=1d`
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(7_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MeuCanga/1.0)' },
    })
    if (!res.ok) return null
    const data: YahooChartResponse = await res.json()
    const meta = data.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    return { ticker: fromYahoo(meta.symbol), meta }
  } catch {
    return null
  }
}

// ─── GET /api/cotacoes ────────────────────────────────────────────────────────
// Query: ?tickers=HGLG11,PETR4,BTC
// Retorna: { [ticker]: CotacaoDTO }

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const tickersParam = request.nextUrl.searchParams.get('tickers')
    if (!tickersParam?.trim()) return errorResponse('Parâmetro "tickers" é obrigatório')

    const tickers = tickersParam
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean)

    if (tickers.length === 0)         return errorResponse('Nenhum ticker válido fornecido')
    if (tickers.length > MAX_TICKERS) return errorResponse(`Máximo ${MAX_TICKERS} tickers por requisição`)

    const now    = new Date()
    const cutoff = new Date(now.getTime() - CACHE_TTL_MS)

    // ── 1. Cache do banco ──────────────────────────────────────────────────
    const cached = await prisma.cotacaoAtivo.findMany({
      where: { ticker: { in: tickers } },
    })
    const cachedMap = new Map(cached.map(c => [c.ticker, c]))

    // Tickers com cache expirado ou ausente
    const stale = tickers.filter(t => {
      const c = cachedMap.get(t)
      return !c || c.atualizadoEm < cutoff
    })

    // ── 2. Busca Yahoo Finance em paralelo para stale ──────────────────────
    if (stale.length > 0) {
      const results = await Promise.all(stale.map(fetchOneTicker))

      await Promise.all(
        results
          .filter((r): r is { ticker: string; meta: YahooMeta } => r !== null)
          .map(({ ticker, meta }) => {
            const preco      = Math.round(meta.regularMarketPrice! * 100)
            const fechamento = meta.chartPreviousClose != null
              ? Math.round(meta.chartPreviousClose * 100)
              : null
            const variacao   = meta.chartPreviousClose
              ? ((meta.regularMarketPrice! - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
              : null
            const nome       = meta.longName ?? meta.shortName ?? null

            return prisma.cotacaoAtivo.upsert({
              where:  { ticker },
              update: {
                nome:               nome ?? undefined,
                precoCentavos:      preco,
                fechamentoCentavos: fechamento ?? undefined,
                variacaoPercent:    variacao ?? undefined,
                atualizadoEm:       now,
                fonte:              'yahoo',
              },
              create: {
                ticker,
                nome,
                precoCentavos:      preco,
                fechamentoCentavos: fechamento,
                variacaoPercent:    variacao,
                atualizadoEm:       now,
                fonte:              'yahoo',
              },
            })
          }),
      )

      // Recarrega do banco os recém-salvos
      const updated = await prisma.cotacaoAtivo.findMany({
        where: { ticker: { in: stale } },
      })
      updated.forEach(c => cachedMap.set(c.ticker, c))
    }

    // ── 3. Monta resposta ─────────────────────────────────────────────────
    const result: Record<string, {
      ticker:             string
      nome:               string | null
      precoCentavos:      number
      fechamentoCentavos: number | null
      variacaoPercent:    number | null
      atualizadoEm:       string
    }> = {}

    for (const ticker of tickers) {
      const c = cachedMap.get(ticker)
      if (c) {
        result[ticker] = {
          ticker:             c.ticker,
          nome:               c.nome,
          precoCentavos:      c.precoCentavos,
          fechamentoCentavos: c.fechamentoCentavos,
          variacaoPercent:    c.variacaoPercent,
          atualizadoEm:       c.atualizadoEm.toISOString(),
        }
      }
    }

    return okResponse(result)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
