import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserById } from './db'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'zealthy_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  // Simple session: store user ID in cookie
  return userId
}

export async function getSessionUserId(request?: NextRequest): Promise<string | null> {
  let sessionId: string | undefined

  if (request) {
    // For API routes, read from request cookies
    sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
  } else {
    // For server components, use cookies()
    const cookieStore = await cookies()
    sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  }
  
  if (!sessionId) {
    return null
  }

  // Verify user still exists
  const user = await getUserById(sessionId)

  return user ? sessionId : null
}

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
