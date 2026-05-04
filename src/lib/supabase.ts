import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
    'Auth features will not work. Check your .env.local file.'
  )
}

// createBrowserClient (do @supabase/ssr) armazena a session em COOKIES
// (sb-{project-ref}-auth-token), tornando-a visível para o servidor via
// createServerClient no proxy.ts e em api-auth.ts.
//
// IMPORTANTE: não use createClient do @supabase/supabase-js no browser quando
// houver SSR, pois ele só persiste em localStorage e o servidor nunca vê a session.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)