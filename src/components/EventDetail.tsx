import { ChevronLeft, Pencil } from 'lucide-react'
import Link from 'next/link'
import { kstKey, parseKey, weekday } from '@/lib/date'
import type { EventRow } from '@/lib/events'

export default function EventDetail({ ev }: { ev: EventRow }) {
  const day = kstKey(ev.starts_at)
  const { y, m, d } = parseKey(day)
  return (
    <div>
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between bg-background/90 px-2 backdrop-blur">
        <Link href="/" aria-label="뒤로" className="p-2">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-sm font-semibold">{y}년 {m}월 {d}일 {weekday(day)}요일</h1>
        <Link href={`/events/${ev.id}/edit`} aria-label="수정" className="p-2">
          <Pencil className="size-5" />
        </Link>
      </header>

      <main className="flex flex-col gap-4 p-4">
        {ev.title && <p className="text-lg font-semibold">{ev.title}</p>}
        {ev.note ? (
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{ev.note}</p>
        ) : (
          ev.photo_paths.length === 0 && <p className="text-sm opacity-50">내용이 없어요</p>
        )}
        {ev.photo_paths.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {ev.photo_paths.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p} src={`/api/photo?path=${p}`} alt="" className="h-auto w-full rounded-lg" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
