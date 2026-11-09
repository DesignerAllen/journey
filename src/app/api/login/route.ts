import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '@/lib/session'

const MAX_FAILS = 5
const LOCK_MINUTES = 15

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({ pin: '' }))
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: '숫자 4자리를 입력하세요' }, { status: 400 })
  }

  // 단일 사용자(커플 공용) 서비스: 전역 키 하나로 시도 횟수를 제한
  const db = supabaseAdmin()
  const key = 'global'
  const { data: row } = await db.from('login_attempts').select('*').eq('key', key).maybeSingle()

  if (row?.locked_until && new Date(row.locked_until) > new Date()) {
    return NextResponse.json({ error: '잠시 후 다시 시도하세요' }, { status: 429 })
  }

  if (!safeEqual(pin, process.env.APP_PIN ?? '')) {
    const fails = (row?.failed_count ?? 0) + 1
    const lock = fails >= MAX_FAILS
    await db.from('login_attempts').upsert({
      key,
      failed_count: lock ? 0 : fails,
      locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'PIN이 올바르지 않습니다' }, { status: 401 })
  }

  await db.from('login_attempts').upsert({ key, failed_count: 0, locked_until: null, updated_at: new Date().toISOString() })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
