import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyHqToken, COOKIE_NAME } from '@/lib/hq-auth'
import { prisma } from '@/lib/prisma'

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
  const role = body.role === 'admin' ? 'admin' : 'user'

  try {
    await prisma.user.update({ where: { id }, data: { role } })
    return NextResponse.json({ success: true, role })
  } catch (err) {
    console.error('[admin/toggle-role]', err)
    return NextResponse.json({ error: 'Erro ao alterar role' }, { status: 500 })
  }
}
