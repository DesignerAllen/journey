'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
import { invalidate } from '@/lib/cache'
import { compressImage } from '@/lib/compress'
import type { EventRow } from '@/lib/events'

// 새로 고른 사진은 file, 이미 저장된 사진은 path 를 가진다
type Photo = { id: string; url: string; file?: File; path?: string }

const field = 'block w-full min-w-0 appearance-none rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black'

type Props = { defaultDate: string; defaultNote?: string; event?: EventRow }

// Next 의 화면 상태 보존(Activity) 때문에 이전에 쓰던 입력값이 남아 있으므로,
// 새로 이동할 때마다(뒤로/앞으로 제외) 폼 상태를 초기화한다
export default function NewEventForm(props: Props) {
  const { bfcacheId } = useRouter()
  return <EventForm key={bfcacheId} {...props} />
}

function EventForm({ defaultDate, defaultNote = '', event }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(defaultDate)
  const [note, setNote] = useState(defaultNote)
  const [photos, setPhotos] = useState<Photo[]>(() =>
    (event?.photo_paths ?? []).map((path) => ({ id: path, path, url: `/api/photo?path=${path}` })),
  )
  const [compressing, setCompressing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => () => photos.forEach((p) => p.file && URL.revokeObjectURL(p.url)), [photos])

  async function addFiles(list: FileList | null) {
    if (!list?.length) return
    setCompressing(true)
    setError('')
    try {
      const added: Photo[] = []
      for (const f of Array.from(list)) {
        const file = await compressImage(f)
        added.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(file), file })
      }
      setPhotos((p) => [...p, ...added].slice(0, 10))
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지를 처리하지 못했어요')
    }
    setCompressing(false)
  }

  async function remove() {
    if (!event || deleting) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      invalidate('timeline', 'month:*', 'day:*')
      router.replace('/')
      router.refresh()
    } catch {
      setError('삭제하지 못했어요. 다시 시도해주세요')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (saving || compressing) return
    setSaving(true)
    setError('')
    try {
      const paths: string[] = []
      for (const p of photos) {
        if (p.path) {
          paths.push(p.path)
          continue
        }
        const fd = new FormData()
        fd.append('file', p.file as File)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error ?? '업로드에 실패했어요')
        paths.push(d.path)
      }
      const res = await fetch(event ? `/api/events/${event.id}` : '/api/events', {
        method: event ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          note,
          all_day: true,
          starts_at: new Date(`${date}T00:00:00+09:00`).toISOString(),
          photo_paths: paths,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error ?? '저장에 실패했어요')
      invalidate('timeline', 'month:*', 'day:*')
      router.replace(event ? `/days/${date}` : '/')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <header className="-mt-2 flex h-14 items-center justify-between">
        <Link href={event ? `/days/${defaultDate}` : '/'} className="py-2 text-base">취소</Link>
        <h1 className="text-lg font-semibold">{event ? '일정 수정' : '일정 등록'}</h1>
        <button type="submit" disabled={(!note.trim() && photos.length === 0) || saving || compressing} className="py-2 text-base font-semibold disabled:opacity-30">
          {saving ? '저장 중…' : '저장'}
        </button>
      </header>

      <input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <textarea className={`${field} min-h-32 resize-y`} placeholder="메모" value={note} maxLength={5000} onChange={(e) => setNote(e.target.value)} />

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>사진 ({photos.length}/10)</span>
          {compressing && <span className="opacity-50">압축 중…</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                aria-label="사진 삭제"
                onClick={() => setPhotos((l) => l.filter((x) => x.id !== p.id))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ×
              </button>
              {p.file && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">{Math.round(p.file.size / 1024)}KB</span>
              )}
            </div>
          ))}
          {photos.length < 10 && (
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed border-black/30 text-2xl">
              +
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {event && (
        <>
          <Button type="button" variant="destructive" className="mt-4 h-12 w-full" onClick={() => setConfirmDelete(true)}>
            지울래
          </Button>
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>우리 추억을 지울거야? ㅠ</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>아니!</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleting}
                  onClick={(e) => {
                    e.preventDefault()
                    remove()
                  }}
                >
                  {deleting ? '지우는 중…' : '응 지울래...'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </form>
  )
}
