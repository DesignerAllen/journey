import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type Todo = { id: string; title: string; done: boolean; created_at: string }

export const TODO_COLS = 'id,title,done,created_at'

/** 안 한 것 먼저(오래된 순), 한 것은 뒤로 */
export async function fetchTodos(): Promise<Todo[]> {
  const { data, error } = await supabaseAdmin()
    .from('todos')
    .select(TODO_COLS)
    .order('done', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw error
  return data as Todo[]
}
