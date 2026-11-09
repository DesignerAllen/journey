'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(value: string) {
    setBusy(true)
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: value }),
    })
    if (res.ok) {
      router.replace('/')
      router.refresh()
      return
    }
    const data = await res.json().catch(() => ({}))
    setError(data.error ?? '오류가 발생했습니다')
    setPin('')
    setBusy(false)
  }

  function press(d: string) {
    if (busy || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === 4) submit(next)
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-2xl font-semibold">Journey</h1>
      <div className="flex gap-3" aria-label="PIN 입력 상태">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-4 w-4 rounded-full border ${i < pin.length ? 'bg-current' : ''}`} />
        ))}
      </div>
      <p className="h-5 text-sm text-red-500">{error}</p>
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={busy}
              onClick={() => (k === '⌫' ? setPin(pin.slice(0, -1)) : press(k))}
              className="h-16 w-16 rounded-full border text-xl active:scale-95"
            >
              {k}
            </button>
          ),
        )}
      </div>
    </main>
  )
}
