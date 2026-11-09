import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PATH_RE = /^[0-9a-f-]{36}\.jpg$/i

// 비공개 버킷의 사진을 짧은 서명 URL 로 리다이렉트 (로그인은 proxy 에서 확인)
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') ?? ''
  if (!PATH_RE.test(path)) return NextResponse.json({ error: 'bad path' }, { status: 400 })
  const { data, error } = await supabaseAdmin().storage.from('event-photos').createSignedUrl(path, 3600)
  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.redirect(data.signedUrl, { headers: { 'Cache-Control': 'private, max-age=1800' } })
}
