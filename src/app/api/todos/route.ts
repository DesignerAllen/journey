import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchTodos, TODO_COLS } from '@/lib/todos'

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const title = typeof b?.title === 'string' ? b.title.trim().slice(0, 2000) : ''
  if (!title) return NextResponse.json({ error: '내용을 적어주세요' }, { status: 400 })
  const { data, error } = await supabaseAdmin().from('todos').insert({ title }).select(TODO_COLS).single()
  if (error) return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  try {
    return NextResponse.json({ todos: await fetchTodos() })
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
