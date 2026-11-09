'use client'

import { Check, Heart, X } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Todo } from '@/lib/todos'

type Props = {
  onAdded: (todo: Todo) => void
  /** 바깥에서 열고 닫을 때 사용 (없으면 내부 상태) */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** false 면 평소엔 숨기고 open 일 때만 보인다 */
  showTrigger?: boolean
}

export default function WishFab({ onAdded, open: openProp, onOpenChange, showTrigger = true }: Props) {
  const [innerOpen, setInnerOpen] = useState(false)
  const open = openProp ?? innerOpen
  const setOpen = (o: boolean) => {
    setInnerOpen(o)
    onOpenChange?.(o)
  }
  const [text, setText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit() {
    if (!text.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text }),
      })
      if (!res.ok) throw new Error()
      onAdded(await res.json())
      setText('')
      setOpen(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('등록하지 못했어요. 다시 시도해주세요')
    }
    setSaving(false)
  }

  return (
    <>
      <div className={`pointer-events-none fixed left-1/2 top-16 z-20 w-full max-w-md -translate-x-1/2 px-4 ${!showTrigger && !open ? 'invisible' : ''}`}>
        <div
          className={`pointer-events-auto mx-auto origin-top overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg transition-all duration-300 ease-out ${open ? 'w-full' : 'w-52'}`}
        >
          {open ? (
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Heart className="size-4 fill-current" /> 너랑 같이 하고 싶어
              </span>
              <button type="button" aria-label="닫기" onClick={() => setConfirming(true)} className="-mr-1 rounded-full p-1">
                <X className="size-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-semibold"
            >
              {saved ? <Check className="size-4" /> : <Heart className="size-4 fill-current" />}
              {saved ? '등록했어요' : '너랑 같이 하고 싶어'}
            </button>
          )}

          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="flex flex-col gap-3 p-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="같이 하고 싶은 걸 자유롭게 적어줘"
                  maxLength={2000}
                  className="min-h-32 resize-none"
                  tabIndex={open ? 0 : -1}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={submit} disabled={!text.trim() || saving} className="w-full">
                  {saving ? '등록 중…' : '이거 할래!'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>더 고민하고 알려줄거야?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>지금 적을래</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirming(false)
                setOpen(false)
              }}
            >
              더 고민해볼게
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
