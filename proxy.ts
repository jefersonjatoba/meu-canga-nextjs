import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─── Rate limiting ────────────────────────────────────────────────────────────
// In-memory sliding window per IP. For multi-instance production swap for
// Upstash Redis (@upstash/ratelimit).
//
// Limits:
//   Mutations (POST/PATCH/PUT/DELETE): 30 req/min per IP
//   Reads    (GET):                    120 req/min per IP

interface RateWindow { count: number; resetAt: number }

const store = new Map<string, RateWindow>()
let lastPrune = Date.now()

function maybePrune() {
  const now = Date.now()
  if (now - lastPrune < 300_000) return
  lastPrune = now
  for (const [key, win] of store.entries()) {
    if (now > win.resetAt) store.delete(key)
  }
}

function rateLimit(key: string, limit: number, windowMs = 60_000) {
  maybePrune()
  const now = Date.now()
  const win = store.get(key)

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  win.count++
  return { ok: win.count <= limit, remaining: Math.max(0, limit - win.count), resetAt: win.resetAt }
}

// ─── Rotas protegidas ────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ['/dashboard']

// ─── Proxy function ───────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const adminPath = process.env.ADMIN_PATH ?? 'hq'

  // ── Bloqueia acesso direto a /admin/* — retorna 404 para não revelar o caminho
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse(null, { status: 404 })
  }

  // ── Reescreve /{ADMIN_PATH}/* → /admin/* (URL secreta → rota interna)
  const secretBase = `/${adminPath}`
  if (pathname === secretBase || pathname.startsWith(`${secretBase}/`)) {
    const url = request.nextUrl.clone()
    const rest = pathname.slice(secretBase.length)
    url.pathname = '/admin' + rest
    return NextResponse.rewrite(url)
  }

  // ── Rate limiting em rotas de API
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'

    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
    const limit = isMutation ? 30 : 120
    const key   = `${isMutation ? 'm' : 'r'}:${ip}`

    const { ok, remaining, resetAt } = rateLimit(key, limit)

    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
        {
          status: 429,
          headers: {
            'Retry-After':           String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit':     String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset':     String(Math.ceil(resetAt / 1000)),
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit',     String(limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset',     String(Math.ceil(resetAt / 1000)))
    return response
  }

  // ── Auth check para rotas protegidas do dashboard ───────────────────────────
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (isProtected) {
    // Cria o response base antes para permitir que o Supabase atualize cookies
    const response = NextResponse.next({
      request: { headers: request.headers },
    })

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
                response.cookies.set(name, value, options)
              })
            },
          },
        }
      )

      // Caminho rápido: verificação LOCAL do JWT (getClaims, sem rede) para
      // tokens válidos — a maioria das navegações. Remove ~200ms por navegação.
      let authed = false
      try {
        const { data } = await supabase.auth.getClaims()
        authed = !!data?.claims?.sub
      } catch { /* fallback abaixo */ }

      // Fallback: token expirado/ausente → getUser() revalida E renova via rede,
      // gravando os cookies renovados na response (setAll acima). Só executa
      // quando necessário, mantendo a sessão consistente.
      if (!authed) {
        const { data: { user } } = await supabase.auth.getUser()
        authed = !!user
      }

      if (!authed) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      // Falha inesperada (ex.: Supabase fora do ar): bloqueia por segurança
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|images/|icons/|manifest\\.json|sw\\.js).*)'],
}
