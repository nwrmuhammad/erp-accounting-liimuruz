import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/health',
];

const PUBLIC_PAGES = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes — coarse auth gate
  if (pathname.startsWith('/api')) {
    if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const hasBearer = req.headers.get('authorization')?.startsWith('Bearer ');
    const hasCookie = req.cookies.has('access_token');
    if (!hasBearer && !hasCookie) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  const hasCookie = req.cookies.has('access_token');

  // Logged-in user tries to visit /login -> redirect to dashboard
  if (pathname === '/login' && hasCookie) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Unauthenticated user visits protected page -> redirect to /login
  if (!PUBLIC_PAGES.includes(pathname) && !hasCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
