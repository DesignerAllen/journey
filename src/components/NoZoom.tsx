'use client'

import { useEffect } from 'react'

// iOS Safari 는 viewport 설정만으로 핀치 확대를 막지 못하므로 제스처 이벤트를 직접 막는다
export default function NoZoom() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault()
    const events = ['gesturestart', 'gesturechange', 'gestureend']
    events.forEach((n) => document.addEventListener(n, stop))
    return () => events.forEach((n) => document.removeEventListener(n, stop))
  }, [])
  return null
}
