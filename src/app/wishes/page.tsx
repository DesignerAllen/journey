import { Suspense } from 'react'
import { connection } from 'next/server'
import TodoListApp from '@/components/TodoListApp'
import { todayKey } from '@/lib/date'

async function Wishes() {
  await connection()
  return <TodoListApp today={todayKey()} />
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">불러오는 중…</p>}>
      <Wishes />
    </Suspense>
  )
}
