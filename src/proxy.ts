import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authed = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname === '/login') {
    return authed ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next()
  }
  if (!authed) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  // /api/login 과 정적 리소스는 제외
  matcher: ['/((?!api/login|_next/static|_next/image|favicon.ico).*)'],
}
