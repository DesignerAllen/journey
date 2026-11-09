'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { invalidate } from '@/lib/cache'
import type { Todo } from '@/lib/todos'

type Props = { data: Todo[]; today: string }

export default function TodoList({ data, today }: Props) {
  const router = useRouter()
  const [prevData, setPrevData] = useState(data)
  const [todos, setTodos] = useState(data)
  if (data !== prevData) {
    setPrevData(data)
    setTodos(data)
  }
  const [picked, setPicked] = useState<Todo | null>(null)
  const [error, setError] = useState('')

  async function record() {
    if (!picked) return
    setError('')
    try {
      const res = await fetch(`/api/todos/${picked.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      })
      if (!res.ok) throw new Error()
      const updated: Todo = await res.json()
      setTodos((l) => [...l.filter((x) => !x.done && x.id !== updated.id), ...l.filter((x) => x.done && x.id !== updated.id), updated])
      const qs = new URLSearchParams({ date: today, note: picked.title })
      invalidate('todos', 'timeline')
      setPicked(null)
      router.push(`/events/new?${qs}`)
    } catch {
      setError('저장하지 못했어요. 다시 시도해주세요')
    }
  }

  const undone = todos.filter((t) => !t.done).length

  return (
    <>
      <header className="sticky top-0 z-10 flex h-12 items-center bg-background/90 px-2 backdrop-blur">
        <Link href="/" aria-label="뒤로" className="p-2">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-sm font-semibold">너랑 같이 하고 싶은거 {undone}개</h1>
      </header>
      <ul className="flex flex-col gap-2 p-4">
        {todos.length === 0 && <li className="py-10 text-center text-sm opacity-50">아직 적은 게 없어요</li>}
        {todos.map((t) => (
          <li key={t.id}>
            <label className={`flex items-start gap-3 rounded-lg border p-3 ${t.done ? 'opacity-50' : ''}`}>
              <Checkbox checked={t.done} disabled={t.done} onCheckedChange={(v) => v && setPicked(t)} className="mt-0.5" />
              <span className={`whitespace-pre-wrap break-words text-sm ${t.done ? 'line-through' : ''}`}>{t.title}</span>
            </label>
          </li>
        ))}
      </ul>

      <AlertDialog open={picked !== null} onOpenChange={(o) => !o && setPicked(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>우리 이거했다!</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap break-words">{picked?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>앗! 실수로 눌렀다</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); record() }}>기록하자!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
