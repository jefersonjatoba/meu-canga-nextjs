// Type-safe environment variable access.
// Server-only — do NOT import in client components.
// Fails fast at import time when required variables are missing.

function req(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing required env var: ${key}`)
  return v
}

function opt(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export const env = {
  DATABASE_URL: req('DATABASE_URL'),

  SUPABASE_URL:              opt('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY:         opt('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: opt('SUPABASE_SERVICE_ROLE_KEY'),

  APP_NAME:    opt('NEXT_PUBLIC_APP_NAME', 'Meu Canga'),
  APP_VERSION: opt('NEXT_PUBLIC_APP_VERSION', '2.0.0'),
  APP_URL:     opt('NEXTAUTH_URL', 'http://localhost:3000'),

  CRON_SECRET: opt('CRON_SECRET'),

  NODE_ENV: opt('NODE_ENV', 'development'),

  get isProduction() { return this.NODE_ENV === 'production' },
  get isDevelopment() { return this.NODE_ENV !== 'production' },

  TZ: 'America/Sao_Paulo',
} as const
