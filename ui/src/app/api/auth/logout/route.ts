import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(_req: NextRequest) {
  cookies().delete('pokehub_session');
  return NextResponse.redirect(new URL('/auth/login', _req.url), { status: 302 });
}
