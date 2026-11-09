'use client'

import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import EventCard from '@/components/EventCard'
import WishFab from '@/components/WishFab'
import { addDays, kstKey, parseKey, weekday } from '@/lib/date'
import { updateCache } from '@/lib/cache'
import type { Todo } from '@/lib/todos'
import type { EventRow, Page, TimelineData } from '@/lib/events'

const RESTORE_KEY = 'journey:timeline-scroll' // 월 보기로 갈 때 현재 스크롤 위치를 잠깐 보관
const RESTORE_TTL_MS = 30 * 60 * 1000

function readSavedScroll(): number | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    return typeof v.y === 'number' && Date.now() - v.t < RESTORE_TTL_MS ? v.y : null
  } catch {
    return null
  }
}

const WINDOW_DAYS = 14 // 일정이 없어도 오늘 기준 앞뒤로 이만큼의 날짜는 항상 보여줌
const EXTEND_DAYS = 30 // 더보기를 누를 때마다 날짜 범위를 넓히는 일수

type Props = { data: TimelineData }
type Dir = 'past' | 'future'

export default function Timeline({ data }: Props) {
  const { today } = data
  const todos = data.todos
  // 일정 데이터가 실제로 바뀔 때만 목록을 새 데이터 기준으로 다시 맞춘다 (할 일 변경은 해당 안 됨)
  const eventsKey = useMemo(
    () => JSON.stringify([data.today, data.past, data.todayEvents, data.future]),
    [data],
  )
  const [prevKey, setPrevKey] = useState(eventsKey)
  const [past, setPast] = useState(data.past.events)
  const [future, setFuture] = useState(data.future.events)
  const [hasMore, setHasMore] = useState({ past: data.past.hasMore, future: data.future.hasMore })
  const [win, setWin] = useState({ start: addDays(today, -WINDOW_DAYS), end: addDays(today, WINDOW_DAYS) })
  if (eventsKey !== prevKey) {
    setPrevKey(eventsKey)
    setPast(data.past.events)
    setFuture(data.future.events)
    setHasMore({ past: data.past.hasMore, future: data.future.hasMore })
    setWin({ start: addDays(today, -WINDOW_DAYS), end: addDays(today, WINDOW_DAYS) })
  }
  const [busy, setBusy] = useState<Dir | null>(null)
  const [failed, setFailed] = useState<Dir | null>(null)
  const anchor = useRef<{ h: number; y: number } | null>(null)
  const todayRef = useRef<HTMLElement>(null)

  // 진입 시 스크롤: 월 보기에서 돌아온 경우엔 이전 위치, 그 외엔 오늘을 화면 가운데로.
  // Next 가 페이지 이동 직후 맨 위로 스크롤하므로 다음 프레임에 한 번 더 맞춘다.
  // (Next 가 화면을 숨겼다 다시 보여줄 때도 이 effect 가 다시 실행된다)
  useLayoutEffect(() => {
    const savedY = readSavedScroll()
    const apply = () => {
      if (savedY !== null) {
        window.scrollTo(0, savedY)
        return
      }
      const el = todayRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2)
    }
    apply()
    const id = requestAnimationFrame(apply)
    // 저장해 둔 위치는 한 번 쓰고 잠시 뒤 지운다 (개발 모드의 effect 중복 실행 때도 같은 값을 읽도록)
    setTimeout(() => {
      try {
        sessionStorage.removeItem(RESTORE_KEY)
      } catch {}
    }, 1500)
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])

  // 위쪽에 추가된 만큼 스크롤 위치 보정
  useLayoutEffect(() => {
    if (!anchor.current) return
    const { h, y } = anchor.current
    anchor.current = null
    window.scrollTo(0, y + document.documentElement.scrollHeight - h)
  }, [past, win.start])

  async function more(dir: Dir) {
    if (busy) return
    setBusy(dir)
    setFailed(null)
    try {
      let events: EventRow[] = []
      let next = false
      const last = dir === 'past' ? past[0] : future[future.length - 1]
      if (hasMore[dir] && last) {
        const qs = new URLSearchParams({ dir, ts: last.starts_at, id: last.id })
        const res = await fetch(`/api/events?${qs}`)
        if (!res.ok) throw new Error()
        const data: Page = await res.json()
        events = data.events
        next = data.hasMore
      }
      if (dir === 'past') {
        anchor.current = { h: document.documentElement.scrollHeight, y: window.scrollY }
        setPast((p) => [...events, ...p])
        setWin((w) => ({ ...w, start: addDays(w.start, -EXTEND_DAYS) }))
      } else {
        setFuture((f) => [...f, ...events])
        setWin((w) => ({ ...w, end: addDays(w.end, EXTEND_DAYS) }))
      }
      setHasMore((h) => ({ ...h, [dir]: next }))
    } catch {
      setFailed(dir)
    }
    setBusy(null)
  }

  // 날짜별 그룹: 일정이 있는 날 + 날짜 범위(win) 안의 모든 날(빈 날 포함)
  const groups = new Map<string, EventRow[]>()
  for (let d = win.start; d <= win.end; d = addDays(d, 1)) groups.set(d, [])
  for (const e of [...past, ...data.todayEvents, ...future]) {
    const k = kstKey(e.starts_at)
    groups.set(k, [...(groups.get(k) ?? []), e])
  }
  // 같은 날 안에서는 등록한 순서대로
  for (const list of groups.values()) list.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
  const days = [...groups.keys()].sort()

  const moreButton = (dir: Dir) => (
    <div className="py-3 text-center">
      <button
        type="button"
        onClick={() => more(dir)}
        disabled={busy !== null}
        className="rounded-full border border-black/20 px-5 py-2 text-sm disabled:opacity-40"
      >
        {busy === dir ? '좀만 기다려줘엇...' : failed === dir ? '다시 시도' : dir === 'past' ? '우리 추억 더보기' : '우리 계획 더보기'}
      </button>
      {failed === dir && <p className="mt-1 text-xs text-red-500">불러오지 못했어요</p>}
    </div>
  )

  return (
    <div>
      <header className="sticky top-0 z-10 flex h-14 items-center bg-background/90 backdrop-blur">
        <div className="flex w-16 justify-center">
          <Link
            href="/month"
            aria-label="월 보기"
            className="flex size-11 items-center justify-center rounded-full active:bg-black/5"
            onClick={() => {
              try {
                sessionStorage.setItem(RESTORE_KEY, JSON.stringify({ y: window.scrollY, t: Date.now() }))
              } catch {}
            }}
          >
            <CalendarDays className="size-7" />
          </Link>
        </div>
        <Button variant="ghost" className="ml-auto mr-2 h-10 px-3 text-sm" render={<Link href="/wishes" />}>
          {todos.some((t) => !t.done)
            ? `너랑 같이 하고 싶은거 ${todos.filter((t) => !t.done).length}개`
            : '같이 뭘 해볼까?'}
        </Button>
      </header>

      <WishFab
        onAdded={(todo) => {
          const add = (l: Todo[]) => [...l.filter((x) => !x.done), todo, ...l.filter((x) => x.done)]
          updateCache<{ todos: Todo[] }>('todos', (d) => ({ todos: add(d.todos) }))
          updateCache<TimelineData>('timeline', (d) => ({ ...d, todos: add(d.todos) }))
        }}
      />


      <main className="pt-14">
        {moreButton('past')}

        <div className="border-t border-black/10">
          {days.map((day) => {
            const { m, d } = parseKey(day)
            const isToday = day === today
            const list = groups.get(day)!
            const addHref = `/events/new?date=${day}`
            return (
              <section
                key={day}
                ref={isToday ? todayRef : undefined}
                className={`relative flex min-h-20 border-b border-black/10 ${isToday ? 'bg-black/[0.04]' : ''}`}
              >
                <div className="flex w-16 shrink-0 items-center border-r border-black/10 pl-3">
                  <div className="flex flex-col items-start gap-1 leading-none">
                    <span className="text-xs text-zinc-400">{m}</span>
                    <span className="text-xl font-semibold text-zinc-700">{d}</span>
                    <span className={`text-xs ${weekday(day) === '일' ? 'text-red-400' : 'text-zinc-400'}`}>{weekday(day)}</span>
                  </div>
                </div>
                {list.length === 0 ? (
                  <Link href={addHref} prefetch={false} className="flex-1" aria-label={`${m}월 ${d}일 일정 등록`} />
                ) : (
                  <div className="flex flex-1 flex-col gap-1 p-1.5">
                    {list.map((ev) => <EventCard key={ev.id} ev={ev} href={`/days/${day}`} />)}
                    <Link href={addHref} prefetch={false} className="rounded-xl border border-dashed border-black/20 py-1.5 text-center text-sm opacity-60">
                      오늘 한 거 기록하자!
                    </Link>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {moreButton('future')}
      </main>
    </div>
  )
}
