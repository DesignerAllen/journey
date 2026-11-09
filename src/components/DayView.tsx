'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useCached } from '@/lib/cache'
import { addDays, parseKey, weekday } from '@/lib/date'
import type { EventRow } from '@/lib/events'

export default function DayView({ date }: { date: string }) {
  const { y, m, d } = parseKey(date)
  const { data, error } = useCached<{ events: EventRow[] }>(
    `day:${date}`,
    `/api/events?from=${date}&to=${addDays(date, 1)}`,
  )
  // 등록한 순서대로
  const events = [...(data?.events ?? [])].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))

  return (
    <div>
      <header className="sticky top-0 z-10 flex h-14 items-center bg-background/90 px-2 backdrop-blur">
        <Link href="/" aria-label="뒤로" className="p-2.5">
          <ChevronLeft className="size-7" />
        </Link>
        <h1 className="text-base font-semibold">{y}년 {m}월 {d}일 {weekday(date)}요일</h1>
      </header>

      {!data ? (
        <p className="p-8 text-center text-sm opacity-50">
          {error ? '불러오지 못했어요. 새로고침 해주세요' : '좀만 기다려줘엇...'}
        </p>
      ) : events.length === 0 ? (
        <p className="p-8 text-center text-sm opacity-50">기록이 없어요</p>
      ) : (
        <main>
          {events.map((ev) => (
            <article key={ev.id} className="flex flex-col gap-3 border-b border-black/10 p-4">
              {ev.title && <p className="text-lg font-semibold">{ev.title}</p>}
              {ev.note && <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{ev.note}</p>}
              {ev.photo_paths.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {ev.photo_paths.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p} src={`/api/photo?path=${p}&w=640`} alt="" className="h-auto w-full rounded-lg" />
                  ))}
                </div>
              )}
              <Link href={`/events/${ev.id}/edit`} className="self-end py-1 text-xs text-zinc-400">
                수정
              </Link>
            </article>
          ))}
        </main>
      )}
    </div>
  )
}
