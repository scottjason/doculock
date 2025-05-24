import { NextResponse } from 'next/server';

function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function middleware() {
  const isProd = process.env.NODE_ENV === 'production';
  const apiOrigin = process.env.API_ORIGIN;
  const origin = 'https://doculock.vercel.app';
  const nonce = generateNonce();

  const prodCSP = `
    frame-ancestors 'none';
    default-src 'none';
    script-src 'self' ${origin} 'nonce-${nonce}';
    style-src 'self' ${origin};
    img-src 'self' ${origin} data:;
    font-src 'self' ${origin};
    connect-src 'self' ${origin} ${apiOrigin};
  `.replace(/\n/g, '');

  const devCSP = "frame-ancestors 'none'";

  const csp = isProd ? prodCSP : devCSP;

  const response = NextResponse.next();
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
