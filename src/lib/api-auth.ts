// Shared helper to extract the authenticated user from the NextAuth session
// in API Route Handlers (Next.js 16 App Router).

import { auth } from '@/auth'

export type ApiUser = {
  id: string
  email: string
  name?: string | null
  role: string
}

/**
 * Returns the session user or null if not authenticated.
 * Usage in a route handler:
 *   const user = await getApiUser()
 *   if (!user) return unauthorizedResponse()
 */
export async function getApiUser(): Promise<ApiUser | null> {
  const session = await auth()
  if (!session?.user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any
  return {
    id: (u.id as string) ?? '',
    email: u.email as string,
    name: u.name as string | null | undefined,
    role: (u.role as string) ?? 'user',
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
