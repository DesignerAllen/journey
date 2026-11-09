'use client'

import Link from 'next/link'
import { CalendarDays, Heart, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLayoutEffect, useRef, useState } from 'react'
import EventCard from '@/components/EventCard'
import WishFab from '@/components/WishFab'
import { addDays, kstKey, parseKey, weekday } from '@/lib/date'
import { invalidate } from '@/lib/cache'
import type { EventRow, Page, TimelineData } from '@/lib/events'

const WINDOW_DAYS = 14 // 일정이 없어도 오늘 기준 앞뒤로 이만큼의 날짜는 항상 보여줌
const EXTEND_DAYS = 30 // 더보기를 누를 때마다 날짜 범위를 넓히는 일수

type Props = { data: TimelineData }
type Dir = 'past' | 'future'

export default function Timeline({ data }: Props) {
  const { today } = data
  const [prevData, setPrevData] = useState(data)
  const [todos, setTodos] = useState(data.todos)
  const [past, setPast] = useState(data.past.events)
  const [future, setFuture] = useState(data.future.events)
  const [hasMore, setHasMore] = useState({ past: data.past.hasMore, future: data.future.hasMore })
  const [win, setWin] = useState({ start: addDays(today, -WINDOW_DAYS), end: addDays(today, WINDOW_DAYS) })
  // 서버에서 받은 최신 데이터로 교체되면 목록을 새 데이터 기준으로 다시 맞춘다
  if (data !== prevData) {
    setPrevData(data)
    setTodos(data.todos)
    setPast(data.past.events)
    setFuture(data.future.events)
    setHasMore({ past: data.past.hasMore, future: data.future.hasMore })
    setWin({ start: addDays(today, -WINDOW_DAYS), end: addDays(today, WINDOW_DAYS) })
  }
  const [busy, setBusy] = useState<Dir | null>(null)
  const [failed, setFailed] = useState<Dir | null>(null)
  const anchor = useRef<{ h: number; y: number } | null>(null)
  const todayRef = useRef<HTMLElement>(null)

  // 첫 진입 시 오늘 일정을 화면 가운데로
  useLayoutEffect(() => {
    const el = todayRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2)
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
  const days = [...groups.keys()].sort()

  const moreButton = (dir: Dir) => (
    <div className="py-3 text-center">
      <button
        type="button"
        onClick={() => more(dir)}
        disabled={busy !== null}
        className="rounded-full border border-black/20 px-5 py-2 text-sm disabled:opacity-40"
      >
        {busy === dir ? '불러오는 중…' : failed === dir ? '다시 시도' : dir === 'past' ? '이전 일정 더보기' : '다음 일정 더보기'}
      </button>
      {failed === dir && <p className="mt-1 text-xs text-red-500">불러오지 못했어요</p>}
    </div>
  )

  return (
    <div>
      <header className="sticky top-0 z-10 flex h-12 items-center bg-background/90 backdrop-blur">
        <div className="flex w-16 justify-center">
          <Button variant="outline" size="sm" className="rounded-full" render={<Link href="/month" aria-label="월 보기" />}>
            <CalendarDays /> 월
          </Button>
        </div>
        <h1 className="text-sm font-semibold">Journey</h1>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto mr-4 rounded-full"
          render={<Link href="/wishes" />}
        >
          <Heart className="fill-current" /> 너랑 같이 하고 싶은거 {todos.filter((t) => !t.done).length}개
        </Button>
      </header>

      <WishFab
        onAdded={(t) => {
          setTodos((l) => [...l.filter((x) => !x.done), t, ...l.filter((x) => x.done)])
          invalidate('timeline', 'todos')
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
                className="relative flex min-h-20 border-b border-black/10"
              >
                <div className="w-16 shrink-0 border-r border-black/10">
                  <div className="sticky top-14 flex flex-col items-center py-2">
                    <span className="text-[10px] opacity-50">{m}월</span>
                    <span className={`text-xl font-semibold leading-none ${isToday ? 'rounded-full bg-foreground px-2 py-1 text-background' : ''}`}>
                      {d}
                    </span>
                    <span className={`mt-1 text-xs ${weekday(day) === '일' ? 'text-red-500' : 'opacity-60'}`}>{weekday(day)}</span>
                  </div>
                </div>
                {list.length === 0 ? (
                  <Link href={addHref} prefetch={false} className="flex-1" aria-label={`${m}월 ${d}일 일정 등록`} />
                ) : (
                  <div className="flex flex-1 flex-col gap-2 p-2">
                    {list.map((ev) => <EventCard key={ev.id} ev={ev} />)}
                    <Link href={addHref} prefetch={false} className="rounded-xl border border-dashed border-black/20 py-2 text-center text-sm opacity-60">
                      <Plus className="mr-1 inline size-3.5" />일정 등록
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
