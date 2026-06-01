import { NextRequest, NextResponse } from 'next/server'
import { signHqToken, COOKIE_NAME, isHqAuthConfigured } from '@/lib/hq-auth'

// Brute-force protection em memória (reseta com o servidor — ok para este nível de segurança)
const attempts = new Map<string, { count: number; firstAt: number }>()
const WINDOW_MS  = 5 * 60 * 1000 // 5 min
const MAX_TRIES  = 5

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = attempts.get(ip)
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now })
    return false
  }
  if (rec.count >= MAX_TRIES) return true
  rec.count++
  return false
}

function clearAttempts(ip: string) {
  attempts.delete(ip)
}

// POST /api/hq-auth — valida credenciais e seta cookie de sessão
export async function POST(req: NextRequest) {
  if (!isHqAuthConfigured()) {
    console.error('[HQ] ADMIN_SECRET nao configurado; login HQ desabilitado por seguranca')
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }

  const ip = getIp(req)

  if (isRateLimited(ip)) {
    console.warn(`[HQ] Brute-force bloqueado: ip=${ip}`)
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 5 minutos.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  const ADMIN_USER = process.env.ADMIN_USER
  const ADMIN_PASS = process.env.ADMIN_PASS

  if (
    !ADMIN_USER || !ADMIN_PASS ||
    typeof username !== 'string' || typeof password !== 'string' ||
    username !== ADMIN_USER || password !== ADMIN_PASS
  ) {
    console.warn(`[HQ] Login falhou: ip=${ip} username=${username}`)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  clearAttempts(ip)
  console.info(`[HQ] Login bem-sucedido: ip=${ip}`)

  const token = signHqToken()
  const adminPath = process.env.ADMIN_PATH ?? 'hq'

  const res = NextResponse.json({ success: true, redirectTo: `/${adminPath}` })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 4 * 60 * 60, // 4h
    path: '/',
  })
  return res
}

// DELETE /api/hq-auth — logout
export async function DELETE() {
  const adminPath = process.env.ADMIN_PATH ?? 'hq'
  const res = NextResponse.json({ success: true, redirectTo: `/${adminPath}/login` })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
