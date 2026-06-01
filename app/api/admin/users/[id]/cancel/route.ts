import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyHqToken, COOKIE_NAME } from '@/lib/hq-auth'
import { cancelPro } from '@/server/services/plan.service'

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyHqToken(cookieStore.get(COOKIE_NAME)?.value)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    await cancelPro(id, 'admin_cancel')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/cancel]', err)
    return NextResponse.json({ error: 'Erro ao cancelar PRO' }, { status: 500 })
  }
}
