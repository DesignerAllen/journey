import Link from 'next/link'
import { kstTime } from '@/lib/date'
import type { EventRow } from '@/lib/events'

export default function EventCard({ ev, href }: { ev: EventRow; href: string }) {
  return (
    <Link href={href} prefetch={false} className="block px-2 py-1.5">
      {!ev.all_day && <p className="text-xs opacity-60">{kstTime(ev.starts_at)}</p>}
      {ev.title && <p className="font-medium">{ev.title}</p>}
      {ev.location && <p className="text-sm opacity-60">{ev.location}</p>}
      {ev.note && <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm">{ev.note}</p>}
      {ev.photo_paths.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {ev.photo_paths.slice(0, 3).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={`/api/photo?path=${p}&w=320`} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </Link>
  )
}
