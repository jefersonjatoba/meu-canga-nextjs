// Shared helper to extract the authenticated user from API requests.
// Lê a session do Supabase via @supabase/ssr (cookies sb-{ref}-auth-token...).

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'

export type ApiUser = {
  id: string
  email: string
  name?: string | null
  role: string
}

export type ApiUserWithPlan = ApiUser & {
  plan: string
  planExpiresAt: Date | null
}

export async function getApiUser(): Promise<ApiUser | null> {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() { /* no-op: middleware/proxy cuida do refresh */ },
        },
      }
    )

    // 1) Verificação LOCAL do JWT (getClaims) — token ES256/assimétrico é
    //    verificado via JWKS em cache, SEM round-trip de rede. Remove ~200ms
    //    de latência de auth de toda chamada de API.
    let sub: string | undefined
    let email: string | undefined
    try {
      const { data } = await supabase.auth.getClaims()
      sub = data?.claims?.sub
      email = data?.claims?.email as string | undefined
    } catch { /* fallback abaixo */ }

    // 2) Fallback de rede — só quando getClaims não resolve (token expirado
    //    precisando refresh, ou chave legada). Mantém correção garantida.
    if (!sub) {
      const { data: { user: sbUser } } = await supabase.auth.getUser()
      sub = sbUser?.id
      email = sbUser?.email ?? undefined
    }

    if (!sub) return null

    // PK lookup (id = sub, confirmado prismaIdMatchesSub:true). Email como
    // fallback. Ambos indexados.
    const prismaUser = await prisma.user.findFirst({
      where: email ? { OR: [{ id: sub }, { email }] } : { id: sub },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!prismaUser) return null

    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      role: prismaUser.role,
    }
  } catch {
    return null
  }
}

/** Igual a getApiUser mas inclui plan e planExpiresAt do banco */
export async function getApiUserWithPlan(): Promise<ApiUserWithPlan | null> {
  const base = await getApiUser()
  if (!base) return null
  const row = await prisma.user.findUnique({
    where: { id: base.id },
    select: { plan: true, planExpiresAt: true },
  })
  return {
    ...base,
    plan: row?.plan ?? 'free',
    planExpiresAt: row?.planExpiresAt ?? null,
  }
}

// ─── Standard JSON response helpers ──────────────────────────────────────────

export function okResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function createdResponse<T>(data: T) {
  return Response.json({ success: true, data }, { status: 201 })
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}

export function unauthorizedResponse() {
  return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 })
}

export function notFoundResponse(resource = 'Recurso') {
  return Response.json(
    { success: false, error: `${resource} não encontrado` },
    { status: 404 }
  )
}

export function forbiddenResponse() {
  return Response.json(
    { success: false, error: 'Acesso negado' },
    { status: 403 }
  )
}

export function serverErrorResponse(err: unknown) {
  console.error('[API Error]', err)
  return Response.json(
    { success: false, error: 'Erro interno do servidor' },
    { status: 500 }
  )
}
