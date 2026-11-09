import { Suspense } from 'react'
import NewEventForm from '@/components/NewEventForm'
import { todayKey } from '@/lib/date'

async function Form({ searchParams }: { searchParams: PageProps<'/events/new'>['searchParams'] }) {
  const { date, note } = await searchParams
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey()
  return <NewEventForm defaultDate={d} defaultNote={typeof note === 'string' ? note.slice(0, 5000) : ''} />
}

export default function Page(props: PageProps<'/events/new'>) {
  return (
    <Suspense>
      <Form searchParams={props.searchParams} />
    </Suspense>
  )
}
