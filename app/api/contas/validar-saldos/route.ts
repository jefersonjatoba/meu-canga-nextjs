import { NextRequest, NextResponse } from 'next/server'
import { validateAllBalances, getBalanceDiscrepancies } from '@/server/services/conta.service'
import { getApiUser, unauthorizedResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser()
    if (!user) return unauthorizedResponse()
    const userId = user.id

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
