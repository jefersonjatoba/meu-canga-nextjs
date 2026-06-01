import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'

// GET /api/debug-auth — diagnóstico temporário de autenticação.
// NÃO vaza segredos: só prefixos de chave e mensagens de erro.
// REMOVER após resolver o problema de sessão.
export async function GET() {
  const out: Record<string, unknown> = {}

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    out.supabaseUrl = url
    out.anonKeyPrefix = key.slice(0, 12) // ex: "sb_publishab" ou "eyJhbGciOiJ"
    out.anonKeyLength = key.length
    out.anonKeySet = !!key

    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    out.cookieNames = allCookies.map(c => c.name)
    out.supabaseCookies = allCookies
      .filter(c => c.name.includes('sb-') || c.name.includes('supabase'))
      .map(c => ({ name: c.name, valueLength: c.value.length }))

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return allCookies },
        setAll() {},
      },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    out.getUser_user = userData?.user
      ? { id: userData.user.id, email: userData.user.email }
      : null
    out.getUser_error = userError
      ? { message: userError.message, status: (userError as { status?: number }).status, name: userError.name }
      : null

    const { data: sessionData } = await supabase.auth.getSession()
    out.hasSession = !!sessionData?.session
    if (sessionData?.session) {
      const token = sessionData.session.access_token
      const parts = token.split('.')
      out.jwtHeader = parts[0] ? JSON.parse(Buffer.from(parts[0], 'base64').toString()) : null
      if (parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        out.jwtPayload = { sub: payload.sub, email: payload.email, iss: payload.iss, aud: payload.aud, exp: payload.exp, role: payload.role }
        out.tokenExpired = payload.exp ? (payload.exp * 1000 < Date.now()) : null
      }
    }

    if (userData?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.user.email },
        select: { id: true, email: true },
      })
      out.prismaUserFound = !!dbUser
      out.prismaIdMatchesSub = dbUser?.id === userData.user.id
    }
  } catch (err) {
    out.exception = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }

  return Response.json(out, { headers: { 'Cache-Control': 'no-store' } })
}
