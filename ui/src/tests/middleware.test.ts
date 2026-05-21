import { describe, it, expect, vi } from 'vitest';

// We test the middleware logic by importing and calling it with mock NextRequest objects.
// next/server is mocked since we're in jsdom, not an edge runtime.
vi.mock('next/server', () => {
  class NextResponse {
    static redirect(url: URL | string, opts?: { status?: number }) {
      return { type: 'redirect', url: url.toString(), status: opts?.status ?? 307 };
    }
    static next() {
      return { type: 'next' };
    }
  }
  return { NextResponse };
});

class MockNextRequest {
  url: string;
  cookies: { get: (name: string) => { value: string } | undefined };
  nextUrl: URL;

  constructor(url: string, cookies: Record<string, string> = {}) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.cookies = {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    };
  }
}

describe('middleware', () => {
  it('redirects unauthenticated request to /home to /auth/login', async () => {
    const { middleware } = await import('@/middleware');
    const req = new MockNextRequest('http://localhost/home');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await middleware(req as any);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/auth/login');
  });

  it('passes through authenticated request to /home', async () => {
    const { middleware } = await import('@/middleware');
    const req = new MockNextRequest('http://localhost/home', { pokehub_session: 'valid.jwt.token' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await middleware(req as any);
    expect(res.type).toBe('next');
  });
});
