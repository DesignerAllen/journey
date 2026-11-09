import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { addDays, dayStartISO, todayKey } from '@/lib/date'
import type { Todo } from '@/lib/todos'

export type EventRow = {
  id: string
  title: string
  note: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  photo_paths: string[]
  created_at: string
}

export type Cursor = { ts: string; id: string }
export type Page = { events: EventRow[]; hasMore: boolean }

/** 메인 타임라인 화면 한 번에 필요한 데이터 (클라이언트 캐시 대상) */
export type TimelineData = {
  today: string
  past: Page
  todayEvents: EventRow[]
  future: Page
  todos: Todo[]
}

export const PAGE_SIZE = 30
const COLS = 'id,title,note,location,starts_at,ends_at,all_day,photo_paths,created_at'

/** 과거: 오늘 00:00 이전. cursor 가 있으면 그보다 더 오래된 것. 결과는 오래된 순 */
export async function fetchPast(cursor?: Cursor): Promise<Page> {
  let q = supabaseAdmin().from('events').select(COLS)
  q = cursor
    ? q.or(`starts_at.lt.${cursor.ts},and(starts_at.eq.${cursor.ts},id.lt.${cursor.id})`)
    : q.lt('starts_at', dayStartISO(todayKey()))
  const { data, error } = await q
    .order('starts_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)
  if (error) throw error
  const rows = data as EventRow[]
  return { events: rows.slice(0, PAGE_SIZE).reverse(), hasMore: rows.length > PAGE_SIZE }
}

/** 미래: 내일 00:00 이후. cursor 가 있으면 그보다 더 나중 것. 결과는 빠른 순 */
export async function fetchFuture(cursor?: Cursor): Promise<Page> {
  let q = supabaseAdmin().from('events').select(COLS)
  q = cursor
    ? q.or(`starts_at.gt.${cursor.ts},and(starts_at.eq.${cursor.ts},id.gt.${cursor.id})`)
    : q.gte('starts_at', dayStartISO(addDays(todayKey(), 1)))
  const { data, error } = await q
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(PAGE_SIZE + 1)
  if (error) throw error
  const rows = data as EventRow[]
  return { events: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE }
}

/** [fromKey, toKey) 범위(KST 날짜) 전체 */
export async function fetchRange(fromKey: string, toKey: string): Promise<EventRow[]> {
  const { data, error } = await supabaseAdmin()
    .from('events')
    .select(COLS)
    .gte('starts_at', dayStartISO(fromKey))
    .lt('starts_at', dayStartISO(toKey))
    .order('starts_at', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return data as EventRow[]
}

export function fetchToday() {
  const t = todayKey()
  return fetchRange(t, addDays(t, 1))
}

export type NewEvent = {
  title: string
  note: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  photo_paths: string[]
}

export async function createEvent(ev: NewEvent): Promise<EventRow> {
  const { data, error } = await supabaseAdmin().from('events').insert(ev).select(COLS).single()
  if (error) throw error
  return data as EventRow
}

const ID_RE = /^[0-9a-f-]{36}$/i

export async function fetchEvent(id: string): Promise<EventRow | null> {
  if (!ID_RE.test(id)) return null
  const { data, error } = await supabaseAdmin().from('events').select(COLS).eq('id', id).maybeSingle()
  if (error) throw error
  return data as EventRow | null
}

export type EventPatch = Pick<NewEvent, 'note' | 'starts_at' | 'photo_paths'>

export async function updateEvent(id: string, patch: EventPatch): Promise<EventRow> {
  const { data, error } = await supabaseAdmin().from('events').update(patch).eq('id', id).select(COLS).single()
  if (error) throw error
  return data as EventRow
}

/** 일정과 그 사진 파일을 삭제. 존재하지 않으면 false */
export async function deleteEvent(id: string): Promise<boolean> {
  const db = supabaseAdmin()
  const { data, error } = await db.from('events').delete().eq('id', id).select('photo_paths')
  if (error) throw error
  if (!data?.length) return false
  const paths = data[0].photo_paths as string[]
  // 파일 정리는 실패해도 일정 삭제 결과에는 영향 없음
  if (paths.length) await db.storage.from('event-photos').remove(paths).catch(() => {})
  return true
}
