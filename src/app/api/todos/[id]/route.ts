import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { TODO_COLS } from '@/lib/todos'

const ID_RE = /^[0-9a-f-]{36}$/i

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await req.json().catch(() => null)
  const patch: { done?: boolean; done_at?: string | null; title?: string } = {}
  if (typeof b?.done === 'boolean') {
    patch.done = b.done
    patch.done_at = b.done ? new Date().toISOString() : null
  }
  if (typeof b?.title === 'string') {
    const title = b.title.trim().slice(0, 2000)
    if (title) patch.title = title
  }
  if (!ID_RE.test(id) || Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin().from('todos').update(patch).eq('id', id).select(TODO_COLS).single()
  if (error) return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ID_RE.test(id)) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const { error } = await supabaseAdmin().from('todos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: '삭제에 실패했어요' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
