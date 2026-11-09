import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import EventDetail from '@/components/EventDetail'
import { fetchEvent } from '@/lib/events'

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  const ev = await fetchEvent(id)
  if (!ev) notFound()
  return <EventDetail ev={ev} />
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">불러오는 중…</p>}>
      <Detail params={props.params} />
    </Suspense>
  )
}
