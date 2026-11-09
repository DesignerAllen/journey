'use client'

import Link from 'next/link'
import EventDetail from '@/components/EventDetail'
import { useCached } from '@/lib/cache'
import type { EventRow } from '@/lib/events'

export default function EventView({ id }: { id: string }) {
  const { data, error } = useCached<{ event: EventRow }>(`event:${id}`, `/api/events/${id}`)
  if (data) return <EventDetail ev={data.event} />
  return (
    <div className="p-8 text-center text-sm opacity-50">
      {error ? (
        <>
          일정을 찾을 수 없어요 <Link href="/" className="underline">돌아가기</Link>
        </>
      ) : (
        '불러오는 중…'
      )}
    </div>
  )
}
