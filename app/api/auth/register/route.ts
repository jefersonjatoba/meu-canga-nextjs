import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, buildWelcomeTemplate } from '@/server/services/mailer.service'

export async function POST(req: NextRequest) {
  let createdSupabaseUserId: string | null = null

  try {
    const body = await req.json()
    const { email, password, name, cpf, phone, ref } = body

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

    createdSupabaseUserId = supabaseUser.id

    // Create Prisma user
    let prismaUser
    try {
      prismaUser = await prisma.user.create({
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
    } catch (prismaError) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id)
        createdSupabaseUserId = null
      } catch (rollbackError) {
        console.error('[POST /api/auth/register] Falha ao reverter usuário do Supabase após erro Prisma:', rollbackError)
      }
      throw prismaError
    }

    createdSupabaseUserId = null

    // Registrar indicação se veio com código de referral
    if (ref && typeof ref === 'string') {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: ref },
        select: { id: true },
      })
      if (referrer && referrer.id !== prismaUser.id) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: prismaUser.id,
          },
        }).catch(() => {}) // não bloqueia se falhar
      }
    }

    // Email D+0 — boas-vindas com oferta de 30% off (não bloqueia a resposta)
    sendEmail({
      to: email,
      subject: `Bem-vindo ao MeuCanga, ${name.split(' ')[0]}! 🛡️`,
      htmlContent: buildWelcomeTemplate(name),
      tags: ['boas-vindas', 'onboarding'],
    }).catch(() => {})

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

    if (createdSupabaseUserId) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        await supabaseAdmin.auth.admin.deleteUser(createdSupabaseUserId)
      } catch (rollbackError) {
        console.error('[POST /api/auth/register] Falha na limpeza final do usuário órfão no Supabase:', rollbackError)
      }
    }

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
