import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow admin routes without authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Allow login page and API routes
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check for session cookie for portal routes
  const sessionCookie = request.cookies.get('zealthy_session')
  if (!sessionCookie && request.nextUrl.pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*'],
}
