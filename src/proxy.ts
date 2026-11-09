import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionIssuedAt, signSession } from '@/lib/session'

const RENEW_AFTER_SEC = 60 * 60 * 24 // 하루 이상 지난 세션은 사용 시 갱신 (사용하는 동안 로그인 유지)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const iat = await sessionIssuedAt(request.cookies.get(SESSION_COOKIE)?.value)
  const authed = iat !== null

  if (pathname === '/login') {
    return authed ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next()
  }
  if (!authed) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const res = NextResponse.next()
  if (pathname !== '/api/logout' && Date.now() / 1000 - iat > RENEW_AFTER_SEC) {
    res.cookies.set(SESSION_COOKIE, await signSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
  }
  return res
}

export const config = {
  // /api/login 과 정적 리소스는 제외
  matcher: ['/((?!api/login|_next/static|_next/image|favicon.ico).*)'],
}
