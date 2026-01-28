import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'zealthy_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number): Promise<string> {
  // Simple session: store user ID in cookie
  return userId.toString()
}

export async function getSessionUserId(request?: NextRequest): Promise<number | null> {
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

  const userId = parseInt(sessionId, 10)
  if (isNaN(userId)) {
    return null
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  return user ? userId : null
}

export async function setSessionCookie(userId: number): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, userId.toString(), {
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
