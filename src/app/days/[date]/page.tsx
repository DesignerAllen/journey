import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import DayView from '@/components/DayView'

async function Day({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()
  return <DayView date={date} />
}

export default function Page(props: { params: Promise<{ date: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">좀만 기다려줘엇...</p>}>
      <Day params={props.params} />
    </Suspense>
  )
}
