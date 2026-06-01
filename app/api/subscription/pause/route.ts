import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { pauseSubscription } from '@/server/services/plan.service'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { newExpiry } = await pauseSubscription(user.id)
    return NextResponse.json({ success: true, newExpiry })
  } catch (err) {
    console.error('[POST /api/subscription/pause]', err)
    return NextResponse.json({ error: 'Erro ao pausar assinatura' }, { status: 500 })
  }
}
