import { Suspense } from 'react'
import { connection } from 'next/server'
import TodoList from '@/components/TodoList'
import { todayKey } from '@/lib/date'
import { fetchTodos } from '@/lib/todos'

async function Wishes() {
  await connection()
  return <TodoList initialTodos={await fetchTodos()} today={todayKey()} />
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm opacity-50">불러오는 중…</p>}>
      <Wishes />
    </Suspense>
  )
}
