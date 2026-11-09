'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { addDays, kstKey, parseKey } from '@/lib/date'
import { clearCache, useCached } from '@/lib/cache'
import type { EventRow } from '@/lib/events'

const pad = (n: number) => String(n).padStart(2, '0')

export default function MonthView({ today }: { today: string }) {
  const router = useRouter()
  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    clearCache()
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
      <header className="mb-3 flex items-center justify-between">
        <Link href="/" className="rounded-full border px-3 py-1 text-xs">← 일정</Link>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달">‹</button>
          <h1 className="font-semibold">{ym.y}년 {ym.m}월</h1>
          <button type="button" onClick={() => move(1)} aria-label="다음 달">›</button>
        </div>
        <button type="button" onClick={logout} aria-label="로그아웃" className="flex w-14 justify-end p-1">
          <LogOut className="size-5" />
        </button>
      </header>
      {error && !data && <p className="mb-2 text-center text-sm text-red-500">일정을 불러오지 못했어요</p>}
      <div className="grid grid-cols-7 text-center text-xs opacity-60">
        {['일', '월', '화', '수', '목', '금', '토'].map((w) => <div key={w} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-black/10">
        {cells.map((d, i) => {
          const key = d ? `${ym.y}-${pad(ym.m)}-${pad(d)}` : ''
          const list = (d && byDay.get(key)) || []
          return (
            <div key={i} className="min-h-20 overflow-hidden border-b border-r border-black/10 p-1">
              {d && (
                <>
                  <span className={`text-xs ${key === today ? 'rounded-full bg-foreground px-1.5 py-0.5 text-background' : ''}`}>{d}</span>
                  {list.slice(0, 2).map((e) => (
                    <p key={e.id} className="mt-0.5 truncate rounded bg-black/5 px-1 text-[10px]">{e.title}</p>
                  ))}
                  {list.length > 2 && <p className="text-[10px] opacity-50">+{list.length - 2}</p>}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
