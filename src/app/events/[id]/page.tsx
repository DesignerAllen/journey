import { Suspense } from 'react'
import EventView from '@/components/EventView'

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EventView id={id} />
}

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">불러오는 중…</p>}>
      <Detail params={props.params} />
    </Suspense>
  )
}
