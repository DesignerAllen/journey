import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { TODO_COLS } from '@/lib/todos'

const ID_RE = /^[0-9a-f-]{36}$/i

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await req.json().catch(() => null)
  if (!ID_RE.test(id) || typeof b?.done !== 'boolean') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin()
    .from('todos')
    .update({ done: b.done, done_at: b.done ? new Date().toISOString() : null })
    .eq('id', id)
    .select(TODO_COLS)
    .single()
  if (error) return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 })
  return NextResponse.json(data)
}
