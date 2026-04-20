import { createClient } from '@supabase/supabase-js'

const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
const getAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

// Lazy singleton — avoids crashing at build time when env vars are placeholders
let _supabase: ReturnType<typeof createClient> | null = null
const getClient = () => {
  if (!_supabase) _supabase = createClient(getUrl(), getAnonKey())
  return _supabase
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_t, prop) {
    return (getClient() as any)[prop]
  },
})

export const supabaseAdmin = () =>
  createClient(getUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder')
