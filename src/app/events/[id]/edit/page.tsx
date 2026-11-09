import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import NewEventForm from '@/components/NewEventForm'
import { kstKey } from '@/lib/date'
import { fetchEvent } from '@/lib/events'

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  const ev = await fetchEvent(id)
  if (!ev) notFound()
  return <NewEventForm event={ev} defaultDate={kstKey(ev.starts_at)} defaultNote={ev.note ?? ''} />
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">불러오는 중…</p>}>
      <Edit params={props.params} />
    </Suspense>
  )
}
