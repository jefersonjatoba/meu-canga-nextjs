import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/auth/check-availability?email=xxx  OR  ?cpf=xxx
export async function GET(req: NextRequest) {
  try {
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
      // Busca por dígitos apenas OU com formatação (cobre ambos os formatos de armazenamento)
      const digits = cpf.replace(/\D/g, '')
      const formatted = digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      const user = await prisma.user.findFirst({
        where: { OR: [{ cpf: digits }, { cpf: formatted }] },
        select: { id: true },
      })
      return NextResponse.json({ available: !user })
    }
  } catch (error) {
    console.error('[check-availability]', error)
    return NextResponse.json({ available: true }, { status: 500 })
  }
}
