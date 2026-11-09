import { NextResponse, type NextRequest } from 'next/server'
import { createEvent, fetchFuture, fetchPast, fetchRange, type Cursor, type NewEvent } from '@/lib/events'

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/
const TS_RE = /^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/
const ID_RE = /^[0-9a-f-]{36}$/i

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  try {
    const from = p.get('from')
    const to = p.get('to')
    if (from || to) {
      if (!from || !to || !KEY_RE.test(from) || !KEY_RE.test(to)) {
        return NextResponse.json({ error: 'bad range' }, { status: 400 })
      }
      return NextResponse.json({ events: await fetchRange(from, to) })
    }

    const dir = p.get('dir')
    const ts = p.get('ts')
    const id = p.get('id')
    if ((dir !== 'past' && dir !== 'future') || !ts || !id || !TS_RE.test(ts) || !ID_RE.test(id)) {
      return NextResponse.json({ error: 'bad request' }, { status: 400 })
    }
    const cursor: Cursor = { ts, id }
    return NextResponse.json(dir === 'past' ? await fetchPast(cursor) : await fetchFuture(cursor))
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

const PHOTO_RE = /^[0-9a-f-]{36}\.jpg$/i
const MAX_PHOTOS = 10

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
const time = (v: unknown) => (typeof v === 'string' && TS_RE.test(v) && !isNaN(Date.parse(v)) ? new Date(v).toISOString() : null)

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const title = str(b?.title, 100) ?? ''
  const starts_at = time(b?.starts_at)
  const ends_at = b?.ends_at ? time(b.ends_at) : null
  const photos: unknown = b?.photo_paths ?? []
  if (!starts_at || (b?.ends_at && !ends_at) || (ends_at && ends_at < starts_at)) {
    return NextResponse.json({ error: '날짜를 확인해주세요' }, { status: 400 })
  }
  if (!Array.isArray(photos) || photos.length > MAX_PHOTOS || !photos.every((p) => typeof p === 'string' && PHOTO_RE.test(p))) {
    return NextResponse.json({ error: '사진 정보가 올바르지 않아요' }, { status: 400 })
  }
  const ev: NewEvent = {
    title,
    note: str(b.note, 5000),
    location: str(b.location, 200),
    starts_at,
    ends_at,
    all_day: b.all_day === true,
    photo_paths: photos,
  }
  try {
    return NextResponse.json(await createEvent(ev), { status: 201 })
  } catch {
    return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 })
  }
}
