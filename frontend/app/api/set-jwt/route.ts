import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'JWT is required' }, { status: 400 });
  }

  const response = NextResponse.json({ message: 'JWT set successfully' });
  response.cookies.set('auth_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
