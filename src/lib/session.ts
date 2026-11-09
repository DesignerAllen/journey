import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'journey_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7일

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET 누락')
  return new TextEncoder().encode(s)
}

export async function signSession() {
  return new SignJWT({ ok: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret())
}

/** 세션이 유효하면 발급 시각(초)을 반환, 아니면 null */
export async function sessionIssuedAt(token: string | undefined) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload.iat ?? null
  } catch {
    return null
  }
}
