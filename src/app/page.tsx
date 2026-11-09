import { Suspense } from 'react'
import { connection } from 'next/server'
import Timeline from '@/components/Timeline'
import { fetchTodos } from '@/lib/todos'
import { fetchFuture, fetchPast, fetchToday } from '@/lib/events'
import { todayKey } from '@/lib/date'

async function TimelineLoader() {
  await connection()
  const [past, today, future, todos] = await Promise.all([fetchPast(), fetchToday(), fetchFuture(), fetchTodos()])
  return <Timeline today={todayKey()} initial={{ past, today, future }} todos={todos} />
}

export default function Home() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">불러오는 중…</p>}>
      <TimelineLoader />
    </Suspense>
  )
}
