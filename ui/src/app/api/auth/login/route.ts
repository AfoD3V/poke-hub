import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.redirect(
      new URL('/auth/login?error=Backend+unavailable', req.url),
      { status: 302 }
    );
  }

  if (!res.ok) {
    const body = await res.json() as { error?: string };
    const msg  = encodeURIComponent(body.error ?? 'Invalid credentials');
    return NextResponse.redirect(new URL(`/auth/login?error=${msg}`, req.url), { status: 302 });
  }

  // Extract JWT from Set-Cookie header
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/pokehub_session=([^;]+)/);
  if (match) {
    cookies().set('pokehub_session', match[1], {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
  }

  return NextResponse.redirect(new URL('/home', req.url), { status: 302 });
}
