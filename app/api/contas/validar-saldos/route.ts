import { NextRequest, NextResponse } from 'next/server'
import { validateAllBalances, getBalanceDiscrepancies } from '@/server/services/conta.service'

function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const showOnlyDiscrepancies = request.nextUrl.searchParams.get('discrepancies') === 'true'

    if (showOnlyDiscrepancies) {
      const discrepancies = await getBalanceDiscrepancies(userId)
      return NextResponse.json({
        status: discrepancies.length === 0 ? 'ok' : 'warning',
        discrepancies,
        count: discrepancies.length,
      })
    } else {
      const results = await validateAllBalances(userId)
      const allConsistent = results.every((r) => r.isConsistent)

      return NextResponse.json({
        status: allConsistent ? 'ok' : 'warning',
        results,
        summary: {
          totalContas: results.length,
          contasConsistentes: results.filter((r) => r.isConsistent).length,
          contasComDiscrepancia: results.filter((r) => !r.isConsistent).length,
        },
      })
    }
  } catch (error) {
    console.error('[GET /api/contas/validar-saldos]', error)
    return NextResponse.json(
      { error: 'Erro ao validar saldos' },
      { status: 500 }
    )
  }
}
