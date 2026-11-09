import { NextResponse } from 'next/server'
import { fetchFuture, fetchPast, fetchToday, type TimelineData } from '@/lib/events'
import { fetchTodos } from '@/lib/todos'
import { todayKey } from '@/lib/date'

export async function GET() {
  try {
    const [past, todayEvents, future, todos] = await Promise.all([fetchPast(), fetchToday(), fetchFuture(), fetchTodos()])
    const body: TimelineData = { today: todayKey(), past, todayEvents, future, todos }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
