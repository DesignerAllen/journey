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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import WishFab from '@/components/WishFab'
import { updateCache } from '@/lib/cache'
import type { TimelineData } from '@/lib/events'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [editError, setEditError] = useState('')
  const [wishOpen, setWishOpen] = useState(false)

  // 화면에 반영하면서 캐시(목록/메인 헤더 개수)도 같은 값으로 바로 맞춘다
  function sync(list: Todo[]) {
    setTodos(list)
    updateCache<{ todos: Todo[] }>('todos', () => ({ todos: list }))
    updateCache<TimelineData>('timeline', (t) => ({ ...t, todos: list }))
  }

  function startEdit(t: Todo) {
    setEditingId(t.id)
    setDraft(t.title)
    setEditError('')
  }

  async function saveEdit(t: Todo) {
    if (!draft.trim() || busy) return
    setBusy(true)
    setEditError('')
    try {
      const res = await fetch(`/api/todos/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft }),
      })
      if (!res.ok) throw new Error()
      const updated: Todo = await res.json()
      sync(todos.map((x) => (x.id === t.id ? updated : x)))
      setEditingId(null)
    } catch {
      setEditError('저장하지 못했어요. 다시 시도해주세요')
    }
    setBusy(false)
  }

  async function removeTodo(t: Todo) {
    if (busy) return
    setBusy(true)
    setEditError('')
    try {
      const res = await fetch(`/api/todos/${t.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      sync(todos.filter((x) => x.id !== t.id))
      setEditingId(null)
    } catch {
      setEditError('삭제하지 못했어요. 다시 시도해주세요')
    }
    setBusy(false)
  }

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
      sync([...todos.filter((x) => !x.done && x.id !== updated.id), ...todos.filter((x) => x.done && x.id !== updated.id), updated])
      const qs = new URLSearchParams({ date: today, note: picked.title })
      setPicked(null)
      router.push(`/events/new?${qs}`)
    } catch {
      setError('저장하지 못했어요. 다시 시도해주세요')
    }
  }

  const undone = todos.filter((t) => !t.done).length

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center bg-background/90 px-2 backdrop-blur">
        <Link href="/" aria-label="뒤로" className="p-2.5">
          <ChevronLeft className="size-7" />
        </Link>
        <h1 className="text-base font-semibold">너랑 같이 하고 싶은거 {undone}개</h1>
      </header>
      <ul className="flex flex-col divide-y divide-black/10 px-4 pb-4">
        {todos.length === 0 && (
          <li className="flex flex-col items-center gap-4 py-16">
            <p className="text-sm text-zinc-500">아직 하고 싶은게 없어?</p>
            <Button type="button" className="h-12 px-6" onClick={() => setWishOpen(true)}>
              너랑 같이 하고 싶어
            </Button>
          </li>
        )}
        {todos.map((t) =>
          editingId === t.id ? (
            <li key={t.id} className="flex flex-col gap-3 py-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                autoFocus
                className="min-h-28 resize-none"
              />
              {editError && <p className="text-sm text-red-500">{editError}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="destructive" className="h-12 flex-1" disabled={busy} onClick={() => removeTodo(t)}>
                  삭제
                </Button>
                <Button type="button" className="h-12 flex-1" disabled={busy || !draft.trim()} onClick={() => saveEdit(t)}>
                  수정
                </Button>
              </div>
              <button type="button" className="self-end text-xs text-zinc-400" onClick={() => setEditingId(null)}>
                취소
              </button>
            </li>
          ) : (
            <li key={t.id} className={`flex items-start gap-3 py-3 ${t.done ? 'opacity-50' : ''}`}>
              <label className="flex flex-1 items-start gap-3">
                <Checkbox checked={t.done} disabled={t.done} onCheckedChange={(v) => v && setPicked(t)} className="mt-0.5" />
                <span className={`whitespace-pre-wrap break-words text-sm ${t.done ? 'line-through' : ''}`}>{t.title}</span>
              </label>
              <button type="button" className="shrink-0 py-0.5 text-xs text-zinc-400" onClick={() => startEdit(t)}>
                수정
              </button>
            </li>
          ),
        )}
      </ul>

      <WishFab
        open={wishOpen}
        onOpenChange={setWishOpen}
        showTrigger={false}
        onAdded={(t) => sync([...todos.filter((x) => !x.done), t, ...todos.filter((x) => x.done)])}
      />

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
