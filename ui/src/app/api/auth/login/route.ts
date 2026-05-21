import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

function redirectTo(path: string, req: NextRequest): NextResponse {
  // Use Host header (set by the browser/proxy) rather than req.url, which
  // resolves to the Docker container's internal hostname in standalone mode.
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:4000';
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  return NextResponse.redirect(new URL(path, `${proto}://${host}`), { status: 302 });
}

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
    return redirectTo('/auth/login?error=Backend+unavailable', req);
  }

  if (!res.ok) {
    const body = await res.json() as { error?: string };
    const msg  = encodeURIComponent(body.error ?? 'Invalid credentials');
    return redirectTo(`/auth/login?error=${msg}`, req);
  }

  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/pokehub_session=([^;]+)/);
  if (match) {
    cookies().set('pokehub_session', match[1], {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
  }

  return redirectTo('/home', req);
}
