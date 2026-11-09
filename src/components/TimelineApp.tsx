'use client'

import Timeline from '@/components/Timeline'
import { useCached } from '@/lib/cache'
import type { TimelineData } from '@/lib/events'

// 저장된 데이터가 있으면 바로 보여주고 뒤에서 최신으로 갱신한다
export default function TimelineApp() {
  const { data, error } = useCached<TimelineData>('timeline', '/api/timeline')
  if (data) return <Timeline data={data} />
  return (
    <p className="p-8 text-center text-sm opacity-50">
      {error ? '불러오지 못했어요. 새로고침 해주세요' : '불러오는 중…'}
    </p>
  )
}
