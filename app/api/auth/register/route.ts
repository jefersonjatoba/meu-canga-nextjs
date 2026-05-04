import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, cpf, phone } = body

    if (!email || !password || !name || !cpf) {
      return NextResponse.json(
        { error: 'Email, senha, nome e CPF são obrigatórios' },
        { status: 400 }
      )
    }

    // Create Supabase user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user: supabaseUser }, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (supabaseError || !supabaseUser) {
      console.error('[POST /api/auth/register] Supabase error:', supabaseError)
      return NextResponse.json(
        { error: supabaseError?.message || 'Erro ao criar usuário no Supabase' },
        { status: 400 }
      )
    }

    // Create Prisma user
    const prismaUser = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email,
        cpf,
        name,
        phone: phone || null,
        password: '', // Supabase is the source of truth for password
        role: 'user',
        plan: 'free',
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: prismaUser.id,
        email: prismaUser.email,
        name: prismaUser.name,
      },
    })
  } catch (error) {
    console.error('[POST /api/auth/register]', error)

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Email ou CPF já cadastrado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
