import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

function getCookie(): string {
  try {
    return headers().get('cookie') ?? '';
  } catch {
    return '';
  }
}

export async function proxyGet(path: string, searchParams?: URLSearchParams): Promise<NextResponse> {
  const url = new URL(`${API_BASE}${path}`);
  searchParams?.forEach((v, k) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString(), {
      headers: { cookie: getCookie() },
      cache: 'no-store',
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

export async function proxyPost(path: string, bodyText: string): Promise<NextResponse> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: getCookie() },
      body: bodyText,
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

export async function proxyDelete(path: string, bodyText: string): Promise<NextResponse> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', cookie: getCookie() },
      body: bodyText,
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
