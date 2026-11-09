'use client'

import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { addDays, kstKey, parseKey } from '@/lib/date'
import { clearCache, useCached } from '@/lib/cache'
import type { EventRow } from '@/lib/events'

// 일정 0개 / 1개 / 2개 / 3개 이상 — 잔디처럼 단계별로 진해짐
const LEVEL_BG = ['bg-black/[0.05]', 'bg-primary/25', 'bg-primary/50', 'bg-primary/80']

const pad = (n: number) => String(n).padStart(2, '0')

export default function MonthView({ today }: { today: string }) {
  const router = useRouter()
  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    clearCache()
    try {
      sessionStorage.removeItem('journey:timeline-scroll')
    } catch {}
    router.replace('/login')
    router.refresh()
  }
  const [ym, setYm] = useState(() => ({ y: parseKey(today).y, m: parseKey(today).m }))
  const first = `${ym.y}-${pad(ym.m)}-01`
  const next = ym.m === 12 ? `${ym.y + 1}-01-01` : `${ym.y}-${pad(ym.m + 1)}-01`
  const lead = new Date(`${first}T00:00:00Z`).getUTCDay()
  const daysInMonth = parseKey(addDays(next, -1)).d

  const { data, error } = useCached<{ events: EventRow[] }>(`month:${first}`, `/api/events?from=${first}&to=${next}`)
  const events = data?.events ?? []

  const byDay = new Map<string, EventRow[]>()
  for (const e of events) {
    const k = kstKey(e.starts_at)
    byDay.set(k, [...(byDay.get(k) ?? []), e])
  }

  const move = (delta: number) =>
    setYm(({ y, m }) => {
      const t = y * 12 + (m - 1) + delta
      return { y: Math.floor(t / 12), m: (t % 12) + 1 }
    })

  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="p-4">
      <header className="mb-3 flex h-14 items-center justify-between">
        <Link href="/" aria-label="일정으로" className="flex size-11 items-center justify-center">
          <ChevronLeft className="size-7" />
        </Link>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달" className="flex size-11 items-center justify-center">
            <ChevronLeft className="size-6" />
          </button>
          <h1 className="text-lg font-semibold">{ym.y}년 {ym.m}월</h1>
          <button type="button" onClick={() => move(1)} aria-label="다음 달" className="flex size-11 items-center justify-center">
            <ChevronRight className="size-6" />
          </button>
        </div>
        <button type="button" onClick={logout} aria-label="로그아웃" className="flex size-11 items-center justify-center">
          <LogOut className="size-6" />
        </button>
      </header>
      {error && !data && <p className="mb-2 text-center text-sm text-red-500">일정을 불러오지 못했어요</p>}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const key = `${ym.y}-${pad(ym.m)}-${pad(d)}`
          const level = Math.min(byDay.get(key)?.length ?? 0, 3)
          const isToday = key === today
          return (
            <div
              key={i}
              className={`aspect-square rounded-md p-1.5 text-xs leading-none ${LEVEL_BG[level]} ${level >= 2 ? 'text-white/70' : 'text-zinc-400'} ${isToday ? 'ring-1 ring-zinc-500' : ''}`}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}
