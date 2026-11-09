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

export async function verifySession(token: string | undefined) {
  if (!token) return false
  try {
    await jwtVerify(token, secret())
    return true
  } catch {
    return false
  }
}
