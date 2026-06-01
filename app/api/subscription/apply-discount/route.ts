import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { applyRetentionDiscount } from '@/server/services/plan.service'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { newExpiry } = await applyRetentionDiscount(user.id)
    return NextResponse.json({ success: true, newExpiry })
  } catch (err) {
    console.error('[POST /api/subscription/apply-discount]', err)
    return NextResponse.json({ error: 'Erro ao aplicar desconto' }, { status: 500 })
  }
}
