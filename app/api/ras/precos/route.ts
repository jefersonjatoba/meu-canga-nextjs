import type { NextRequest } from 'next/server'
import {
  okResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-auth'
import {
  RAS_PRICE_TABLE,
  getRasPrice,
  fmtBRL,
  RAS_DURACAO_TYPES,
} from '@/types/ras'
import type { GraduacaoRas, DuracaoRas } from '@/types/ras'

// ─── GET /api/ras/precos ──────────────────────────────────────────────────────
// Returns the full RAS pricing table or a specific price by ?graduacao=&duracao=
// This endpoint is public (no auth required — prices are not sensitive).

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const graduacaoParam = params.get('graduacao')
    const duracaoParam = params.get('duracao')

    // ── Single price lookup ───────────────────────────────────────────────────
    if (graduacaoParam || duracaoParam) {
      if (!graduacaoParam || !duracaoParam) {
        return errorResponse(
          'Informe tanto "graduacao" quanto "duracao" para consulta de preço único'
        )
      }

      const validGraduacoes: GraduacaoRas[] = ['SD/CB', 'SGT/SUBTEN']
      if (!validGraduacoes.includes(graduacaoParam as GraduacaoRas)) {
        return errorResponse(
          `Graduação "${graduacaoParam}" inválida. Use: ${validGraduacoes.join(' | ')}`
        )
      }

      const duracaoNum = parseInt(duracaoParam, 10)
      if (!RAS_DURACAO_TYPES.includes(duracaoNum as DuracaoRas)) {
        return errorResponse(
          `Duração "${duracaoParam}" inválida. Use: ${RAS_DURACAO_TYPES.join(' | ')} (horas)`
        )
      }

      const graduacao = graduacaoParam as GraduacaoRas
      const duracao = duracaoNum as DuracaoRas
      const valorCentavos = getRasPrice(graduacao, duracao)

      return okResponse({
        graduacao,
        duracao,
        valorCentavos,
        valorFormatado: fmtBRL(valorCentavos),
      })
    }

    // ── Full table ────────────────────────────────────────────────────────────
    // Build a rich structure: [{ graduacao, duracao, valorCentavos, valorFormatado }]
    const rows: Array<{
      graduacao: GraduacaoRas
      duracao: DuracaoRas
      valorCentavos: number
      valorFormatado: string
    }> = []

    for (const [grad, duracoes] of Object.entries(RAS_PRICE_TABLE)) {
      for (const [dur, valor] of Object.entries(duracoes)) {
        rows.push({
          graduacao: grad as GraduacaoRas,
          duracao: parseInt(dur, 10) as DuracaoRas,
          valorCentavos: valor,
          valorFormatado: fmtBRL(valor),
        })
      }
    }

    return okResponse({
      tabela: RAS_PRICE_TABLE,
      rows,
      duracoes: RAS_DURACAO_TYPES,
      graduacoes: Object.keys(RAS_PRICE_TABLE) as GraduacaoRas[],
    })
  } catch (err) {
    return serverErrorResponse(err)
  }
}
