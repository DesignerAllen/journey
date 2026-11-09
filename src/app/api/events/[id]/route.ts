import { NextResponse } from 'next/server'
import { deleteEvent, updateEvent } from '@/lib/events'

const ID_RE = /^[0-9a-f-]{36}$/i
const TS_RE = /^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/
const PHOTO_RE = /^[0-9a-f-]{36}\.jpg$/i

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = await req.json().catch(() => null)
  const photos: unknown = b?.photo_paths ?? []
  const ok =
    ID_RE.test(id) &&
    typeof b?.starts_at === 'string' &&
    TS_RE.test(b.starts_at) &&
    !isNaN(Date.parse(b.starts_at)) &&
    Array.isArray(photos) &&
    photos.length <= 10 &&
    photos.every((p) => typeof p === 'string' && PHOTO_RE.test(p))
  if (!ok) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 })
  const note = typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 5000) : null
  try {
    const ev = await updateEvent(id, {
      note,
      starts_at: new Date(b.starts_at).toISOString(),
      photo_paths: photos as string[],
    })
    return NextResponse.json(ev)
  } catch {
    return NextResponse.json({ error: '저장에 실패했어요' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!ID_RE.test(id)) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  try {
    return (await deleteEvent(id))
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: 'not found' }, { status: 404 })
  } catch {
    return NextResponse.json({ error: '삭제에 실패했어요' }, { status: 500 })
  }
}
