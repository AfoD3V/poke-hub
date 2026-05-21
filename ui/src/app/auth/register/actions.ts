'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export async function register(formData: FormData): Promise<{ error: string } | never> {
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { error: 'Backend unavailable' };
  }

  if (!res.ok) {
    const body = await res.json() as { error?: string };
    return { error: body.error ?? 'Registration failed' };
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

  redirect('/home');
}
