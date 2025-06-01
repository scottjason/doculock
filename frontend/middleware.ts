import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTHENTICATED_ROUTES: ReadonlyArray<string> = ['/', '/dashboard'];

function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function isAuthenticatedRoute(pathname: string): boolean {
  return AUTHENTICATED_ROUTES.some(route => pathname.startsWith(route));
}

async function isAuthenticatedUser(): Promise<boolean> {
  const cookiesList = await cookies();
  const token = cookiesList.get('auth_token')?.value || '';
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      console.log('Token verification failed:', response.statusText);
      return false;
    } else {
      return true;
    } // eslint-disable-next-line
  } catch (_err: unknown) {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const isProd = process.env.NODE_ENV === 'production';
  const apiOrigin = process.env.API_ORIGIN;
  const origin = 'https://doculock.vercel.app';
  const nonce = generateNonce();

  const prodCSP = `
    frame-ancestors 'none';
    default-src 'none';
    script-src 'self' ${origin} 'nonce-${nonce}';
    style-src 'self' ${origin} 'unsafe-inline';
    object-src 'none';
    base-uri 'self';
    img-src 'self' ${origin} data:;
    font-src 'self' ${origin};
    connect-src 'self' ${origin} ${apiOrigin};
  `.replace(/\n/g, '');

  const devCSP = "frame-ancestors 'none'";

  const csp = isProd ? prodCSP : devCSP;

  const response = NextResponse.next();
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', csp);

  if (isAuthenticatedRoute(request.nextUrl.pathname)) {
    const isLandingPage = request.nextUrl.pathname === '/';
    const isAuthenticated = await isAuthenticatedUser();
    if (isAuthenticated && isLandingPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (isAuthenticated) {
      return NextResponse.next();
    } else if (!isAuthenticated && isLandingPage) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)', '/dashboard/:path*'],
};
