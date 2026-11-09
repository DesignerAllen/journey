'use client'

import TodoList from '@/components/TodoList'
import { useCached } from '@/lib/cache'
import type { Todo } from '@/lib/todos'

export default function TodoListApp({ today }: { today: string }) {
  const { data, error } = useCached<{ todos: Todo[] }>('todos', '/api/todos')
  if (data) return <TodoList data={data.todos} today={today} />
  return (
    <p className="p-8 text-center text-sm opacity-50">
      {error ? '불러오지 못했어요. 새로고침 해주세요' : '불러오는 중…'}
    </p>
  )
}
