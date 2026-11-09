import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PATH_RE = /^[0-9a-f-]{36}\.jpg$/i

// 비공개 버킷의 사진을 내려준다. 파일명(uuid)이 바뀌지 않으므로 브라우저가 오래 캐시해도 안전하다.
// (로그인은 proxy 에서 확인)
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') ?? ''
  if (!PATH_RE.test(path)) return NextResponse.json({ error: 'bad path' }, { status: 400 })
  const { data, error } = await supabaseAdmin().storage.from('event-photos').download(path)
  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return new Response(data, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
