/**
 * scripts/seed-user.ts
 *
 * Recria o registro de um usuário real no Prisma após reset do banco.
 *
 * Estratégia:
 *   1. Usa o Supabase Admin API (service role key) para localizar o auth user
 *      pelo e-mail. O Supabase é a source of truth para auth.
 *   2. Cria (ou atualiza) o registro correspondente no Prisma usando o MESMO
 *      id do Supabase, garantindo que `getApiUser` consiga ligar o auth user
 *      ao registro Prisma sem ambiguidade.
 *
 * Como executar (Node 20+ carrega o .env.local nativamente):
 *
 *   npx tsx --env-file=.env.local scripts/seed-user.ts
 *
 * Se `tsx` não estiver instalado:
 *   npm i -D tsx
 *
 * Variáveis de ambiente necessárias (já presentes em .env.local):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - DATABASE_URL (para o Prisma)
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

// ─── Config ──────────────────────────────────────────────────────────────────

const TARGET_EMAIL = 'jefersonjatobaa@gmail.com'
const TARGET_NAME = 'Jeferson Jatobá'
const TARGET_CPF = '00000000001' // placeholder — atualize manualmente depois
const TARGET_ROLE = 'admin'
const TARGET_PLAN = 'pro'

// ─── Validações de env ───────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '[seed-user] Faltam variáveis NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.'
  )
  process.exit(1)
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const prisma = new PrismaClient()

// ─── Lookup helper ───────────────────────────────────────────────────────────
// O Supabase Admin SDK não tem getUserByEmail; precisamos paginar listUsers.

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const perPage = 200
  let page = 1
  // Limite de segurança para não loopar infinitamente
  const maxPages = 50

  while (page <= maxPages) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`Erro ao listar users do Supabase: ${error.message}`)
    }
    const match = data.users.find(
      (u) => (u.email ?? '').toLowerCase() === email.toLowerCase()
    )
    if (match) return match.id
    if (data.users.length < perPage) return null // última página
    page += 1
  }
  return null
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[seed-user] Buscando auth user para ${TARGET_EMAIL}...`)
  const authUserId = await findAuthUserIdByEmail(TARGET_EMAIL)

  if (!authUserId) {
    console.error(
      `[seed-user] Nenhum auth user encontrado no Supabase para ${TARGET_EMAIL}.`
    )
    console.error(
      '          Crie a conta primeiro via tela de registro do app ou via Supabase Dashboard.'
    )
    process.exit(2)
  }

  console.log(`[seed-user] Auth user encontrado: ${authUserId}`)
  console.log('[seed-user] Realizando upsert no Prisma...')

  const user = await prisma.user.upsert({
    where: { id: authUserId },
    update: {
      email: TARGET_EMAIL,
      name: TARGET_NAME,
      role: TARGET_ROLE,
      plan: TARGET_PLAN,
    },
    create: {
      id: authUserId, // mesmo ID do Supabase auth
      email: TARGET_EMAIL,
      cpf: TARGET_CPF,
      name: TARGET_NAME,
      password: '', // vazio — Supabase é source of truth
      role: TARGET_ROLE,
      plan: TARGET_PLAN,
    },
  })

  console.log('[seed-user] Sucesso. Registro Prisma:')
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
  })
}

main()
  .catch((err) => {
    console.error('[seed-user] Falha:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
