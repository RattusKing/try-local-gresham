import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect dashboard routes - require auth cookie
  if (pathname.startsWith('/dashboard')) {
    // Check for Firebase auth token in cookies
    const hasAuthCookie = request.cookies.has('__session') ||
                          request.cookies.has('firebase-auth-token')

    // Also check Authorization header (for API-like requests)
    const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ')

    if (!hasAuthCookie && !hasAuthHeader) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('login', 'required')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
