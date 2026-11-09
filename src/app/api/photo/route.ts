import { NextResponse, type NextRequest } from 'next/server'
import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PATH_RE = /^[0-9a-f-]{36}\.jpg$/i

// 화면용 크기(가로 px) → WebP 품질. 원본 대신 이 크기로 줄여서 내려준다.
//  320: 목록 섬네일(96px 표시, 3배 화면 대응) / 640: 상세 2열 격자
const VARIANTS: Record<string, number> = { '320': 68, '640': 72 }

// 비공개 버킷의 사진을 내려준다. 파일명(uuid)이 바뀌지 않으므로 브라우저가 오래 캐시해도 안전하다.
// (로그인은 proxy 에서 확인)
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') ?? ''
  const w = req.nextUrl.searchParams.get('w')
  if (!PATH_RE.test(path) || (w !== null && !(w in VARIANTS))) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin().storage.from('event-photos').download(path)
  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const headers = { 'Cache-Control': 'private, max-age=31536000, immutable' }
  if (w === null) {
    return new Response(data, { headers: { ...headers, 'Content-Type': 'image/jpeg' } })
  }
  try {
    const out = await sharp(Buffer.from(await data.arrayBuffer()))
      .rotate()
      .resize({ width: Number(w), withoutEnlargement: true })
      .webp({ quality: VARIANTS[w] })
      .toBuffer()
    return new Response(new Uint8Array(out), { headers: { ...headers, 'Content-Type': 'image/webp' } })
  } catch {
    // 변환에 실패하면 원본이라도 보여준다
    return new Response(data, { headers: { ...headers, 'Content-Type': 'image/jpeg' } })
  }
}
