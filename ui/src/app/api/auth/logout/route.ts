import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:4000';
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  cookies().delete('pokehub_session');
  return NextResponse.redirect(new URL('/auth/login', `${proto}://${host}`), { status: 302 });
}
