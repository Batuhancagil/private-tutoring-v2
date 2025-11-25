import { NextResponse } from 'next/server';
import { logApiError } from '@/lib/error-logger';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear the auth token cookie
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
