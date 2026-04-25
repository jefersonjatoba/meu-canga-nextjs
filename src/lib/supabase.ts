import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
    'Auth features will not work. Check your .env.local file.'
  )
}

// createClient is safe to call even with empty strings — it will simply fail at
// runtime when a request is made, rather than crashing the module at import time.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)