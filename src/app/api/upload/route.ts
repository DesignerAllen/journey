import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MAX_BYTES } from '@/lib/compress'

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File) || file.type !== 'image/jpeg') {
    return NextResponse.json({ error: 'JPEG 파일만 업로드할 수 있어요' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '파일이 500KB를 넘어요' }, { status: 413 })
  }
  const path = `${randomUUID()}.jpg`
  const { error } = await supabaseAdmin()
    .storage.from('event-photos')
    .upload(path, file, { contentType: 'image/jpeg' })
  if (error) return NextResponse.json({ error: '업로드에 실패했어요' }, { status: 500 })
  return NextResponse.json({ path })
}
