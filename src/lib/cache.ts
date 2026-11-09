'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

// 화면 데이터를 localStorage 에 저장해 두고, 다시 열 때 먼저 보여준 뒤 서버에서 최신값을 받아 갱신한다.
// 저장 데이터의 형태가 바뀌면 버전을 올려 이전 캐시를 버린다
const PREFIX = 'journey:v2:'
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    // 용량 초과/차단: 캐시 없이 동작
  }
  listeners.forEach((l) => l())
}

/** 키 삭제. 끝이 '*' 이면 접두사 일치 전체 삭제 */
export function invalidate(...keys: string[]) {
  try {
    for (const k of keys) {
      if (k.endsWith('*')) {
        const prefix = PREFIX + k.slice(0, -1)
        for (const name of Object.keys(localStorage)) if (name.startsWith(prefix)) localStorage.removeItem(name)
      } else {
        localStorage.removeItem(PREFIX + k)
      }
    }
  } catch {}
  listeners.forEach((l) => l())
}

/** 저장된 값이 있으면 바꿔서 다시 저장 (화면에 이미 반영한 변경을 캐시에도 바로 반영할 때) */
export function updateCache<T>(key: string, fn: (old: T) => T) {
  const raw = read(key)
  if (!raw) return
  try {
    write(key, JSON.stringify(fn(JSON.parse(raw) as T)))
  } catch {}
}

/** 로그아웃 시 전부 삭제 */
export function clearCache() {
  invalidate('*')
}

/** 캐시된 값이 있으면 즉시 반환하고, 서버에서 받은 최신 값이 다르면 교체한다 */
export function useCached<T>(key: string, url: string): { data: T | null; error: boolean } {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  )
  const data = useMemo(() => {
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }, [raw])
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    let alive = true
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        if (!alive) return
        const text = JSON.stringify(json)
        if (text !== read(key)) write(key, text)
        setError(false)
      })
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [key, url])

  useEffect(() => load(), [load])

  // 표시 중에 저장값이 지워지면(무효화) 로딩 상태로 멈추지 않도록 다시 불러온다
  const hadData = useRef(false)
  useEffect(() => {
    if (raw !== null) {
      hadData.current = true
    } else if (hadData.current) {
      hadData.current = false
      return load()
    }
  }, [raw, load])

  return { data, error }
}
