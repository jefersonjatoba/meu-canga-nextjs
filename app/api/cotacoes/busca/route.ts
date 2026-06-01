import type { NextRequest } from 'next/server'
import {
  getApiUser,
  okResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth'

// ─── Tipos Yahoo Finance Search ───────────────────────────────────────────────

interface YahooSearchQuote {
  symbol:       string
  shortname?:   string
  longname?:    string
  quoteType?:   string
  exchange?:    string
  sector?:      string
}

interface YahooSearchResponse {
  quotes?: YahooSearchQuote[]
}

// ─── Mapa quoteType Yahoo → tipo interno ─────────────────────────────────────

const YAHOO_TYPE_MAP: Record<string, string> = {
  EQUITY:      'acao',
  ETF:         'etf',
  MUTUALFUND:  'fundo',
  CRYPTOCURRENCY: 'cripto',
}

// FIIs na B3 vêm como EQUITY com sufixo .SA — detectamos pelo sufixo do ticker
function inferirTipo(symbol: string, quoteType?: string): string {
  const t = symbol.replace('.SA', '')
  // FIIs brasileiros terminam com dígito + dígito (ex: HGLG11, MXRF11)
  if (/\d{2}$/.test(t) && symbol.endsWith('.SA')) return 'fii'
  return YAHOO_TYPE_MAP[quoteType ?? ''] ?? 'acao'
}

// ─── GET /api/cotacoes/busca ─────────────────────────────────────────────────
// Query: ?q=petrobras&tipo=acao
// Retorna lista de ativos correspondentes com ticker e nome

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()

    const q    = request.nextUrl.searchParams.get('q')?.trim()
    const tipo = request.nextUrl.searchParams.get('tipo')?.toLowerCase()

    if (!q || q.length < 2) return errorResponse('Mínimo 2 caracteres para busca')

    // Yahoo Finance search autocomplete — sem autenticação
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&lang=pt-BR&region=BR&quotesCount=15&newsCount=0&listsCount=0&enableFuzzyQuery=false&enableEnhancedTrivialQuery=true`

    let quotes: YahooSearchQuote[] = []
    try {
      const res = await fetch(url, {
        cache:  'no-store',
        signal: AbortSignal.timeout(6_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MeuCanga/1.0)',
          'Accept':     'application/json',
        },
      })

      if (res.ok) {
        const data: YahooSearchResponse = await res.json()
        quotes = data.quotes ?? []
      }
    } catch {
      // Yahoo indisponível — retorna lista vazia
    }

    // Filtra apenas ativos da B3 (.SA) ou cripto, normaliza e filtra por tipo
    const resultados = quotes
      .filter(q => q.symbol?.endsWith('.SA') || q.quoteType === 'CRYPTOCURRENCY')
      .map(q => ({
        ticker: q.symbol.replace('.SA', '').replace('-USD', ''),
        nome:   q.shortname ?? q.longname ?? q.symbol,
        tipo:   inferirTipo(q.symbol, q.quoteType),
        setor:  q.sector ?? null,
      }))
      .filter(r => !tipo || r.tipo === tipo || (tipo === 'fii' && r.tipo === 'fii'))
      .slice(0, 10)

    return okResponse(resultados)
  } catch (err) {
    return serverErrorResponse(err)
  }
}
