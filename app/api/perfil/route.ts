import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/get-current-user'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
  })

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(row)
}
