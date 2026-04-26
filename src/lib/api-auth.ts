// Shared helper to extract the authenticated user from API requests.
// Verifica Supabase token (cookie sb-token) com fallback para NextAuth.

import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export type ApiUser = {
  id: string
  email: string
  name?: string | null
  role: string
}

/**
 * Returns the authenticated user or null.
 * Priority:
 *  1. Supabase token (cookie sb-token) — active auth system
 *  2. NextAuth session (fallback / dev stub)
 */
export async function getApiUser(): Promise<ApiUser | null> {
  // ── 1. Supabase token via cookie ───────────────────────────────────────────
  try {
    const cookieStore = await cookies()
    const sbToken = cookieStore.get('sb-token')?.value

    if (sbToken) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { data: { user: sbUser }, error } = await supabaseAdmin.auth.getUser(sbToken)

      if (!error && sbUser) {
        // Buscar usuário Prisma por email
        let prismaUser = sbUser.email
          ? await prisma.user.findUnique({ where: { email: sbUser.email } })
          : null

        // Fallback: pegar o primeiro usuário (app single-user / dev)
        if (!prismaUser) {
          prismaUser = await prisma.user.findFirst()
        }

        if (prismaUser) {
          return {
            id: prismaUser.id,
            email: prismaUser.email,
            name: prismaUser.name,
            role: prismaUser.role,
          }
        }
      }
    }
  } catch {
    // Supabase check failed — try NextAuth below
  }

  // ── 2. NextAuth session (fallback) ─────────────────────────────────────────
  try {
    const session = await auth()
    if (session?.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const u = session.user as any
      return {
        id: (u.id as string) ?? '',
        email: u.email as string,
        name: u.name as string | null | undefined,
        role: (u.role as string) ?? 'user',
      }
    }
  } catch {}

  return null
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
