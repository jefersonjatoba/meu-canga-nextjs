import { createHmac } from 'crypto'

const COOKIE_NAME = 'mc_hq'
const TTL_MS = 4 * 60 * 60 * 1000 // 4 horas

export function isHqAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET?.trim())
}

function secret() {
  const value = process.env.ADMIN_SECRET?.trim()
  if (!value) {
    throw new Error('ADMIN_SECRET not configured')
  }
  return value
}

export function signHqToken(): string {
  const expires = Date.now() + TTL_MS
  const sig = createHmac('sha256', secret()).update(String(expires)).digest('hex')
  return Buffer.from(JSON.stringify({ expires, sig })).toString('base64url')
}

export function verifyHqToken(token: string | undefined): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'))
    const { expires, sig } = payload
    if (typeof expires !== 'number' || typeof sig !== 'string') return false
    if (Date.now() > expires) return false
    const expected = createHmac('sha256', secret()).update(String(expires)).digest('hex')
    // constant-time comparison to prevent timing attacks
    if (expected.length !== sig.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

export { COOKIE_NAME }
