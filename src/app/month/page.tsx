import { Suspense } from 'react'
import { connection } from 'next/server'
import MonthView from '@/components/MonthView'
import { todayKey } from '@/lib/date'

async function Month() {
  await connection()
  return <MonthView today={todayKey()} />
}

export default function Page() {
  return (
    <Suspense>
      <Month />
    </Suspense>
  )
}
