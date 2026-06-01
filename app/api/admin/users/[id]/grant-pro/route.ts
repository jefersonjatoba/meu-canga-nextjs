import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyHqToken, COOKIE_NAME } from '@/lib/hq-auth'
import { grantPro } from '@/server/services/plan.service'

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyHqToken(cookieStore.get(COOKIE_NAME)?.value)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const days = typeof body.days === 'number' && body.days > 0 ? body.days : 30

  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + days)

  try {
    await grantPro(id, { endsAt, source: 'manual', notes: `admin_grant_${days}d` })
    return NextResponse.json({ success: true, endsAt })
  } catch (err) {
    console.error('[admin/grant-pro]', err)
    return NextResponse.json({ error: 'Erro ao conceder PRO' }, { status: 500 })
  }
}
