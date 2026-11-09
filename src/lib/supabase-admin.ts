import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 요청마다 새로 만들지 않고 재사용해서 Supabase 와의 연결(TLS)을 다시 맺는 비용을 줄인다
let client: SupabaseClient | undefined

export function supabaseAdmin() {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env 누락')
  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}
