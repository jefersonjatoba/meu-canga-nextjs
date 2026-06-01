import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auth/check-availability?email=xxx  OR  ?cpf=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const cpf = searchParams.get('cpf')

  if (!email && !cpf) {
    return NextResponse.json({ error: 'Informe email ou cpf' }, { status: 400 })
  }

  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    return NextResponse.json({ available: !user })
  }

  if (cpf) {
    const user = await prisma.user.findUnique({ where: { cpf }, select: { id: true } })
    return NextResponse.json({ available: !user })
  }
}
