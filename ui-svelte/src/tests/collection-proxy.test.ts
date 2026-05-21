import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for the SvelteKit proxy endpoint: POST /api/collection/add
 *
 * The handler forwards requests to the Hono backend, forwarding the
 * browser's cookie header for auth. On backend failure it returns JSON 502.
 */

const cardPayload = {
  id: 'sv1-001',
  name: 'Bulbasaur',
  supertype: 'Pokémon',
  set: 'SV01',
  number: '001',
  images: { small: '', large: '' }
};

describe('POST /api/collection/add proxy endpoint', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_BASE_URL = 'http://api:3000';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('forwards cookie header to the Hono backend', async () => {
    const { POST } = await import('../routes/api/collection/add/+server');

    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'entry-1', cardId: 'sv1-001' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    globalThis.fetch = fetchSpy;

    const mockRequest = new Request('http://localhost/api/collection/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'pokehub_session=test-token-abc'
      },
      body: JSON.stringify({ cardId: 'sv1-001', card: cardPayload })
    });

    const response = await POST({ request: mockRequest } as Parameters<typeof POST>[0]);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/collection/add'),
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'pokehub_session=test-token-abc'
        })
      })
    );
    expect(response.status).toBe(201);
  });

  it('returns JSON 502 when the backend is unreachable', async () => {
    const { POST } = await import('../routes/api/collection/add/+server');

    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const mockRequest = new Request('http://localhost/api/collection/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'pokehub_session=token'
      },
      body: JSON.stringify({ cardId: 'sv1-001', card: cardPayload })
    });

    const response = await POST({ request: mockRequest } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(502);
    const body = await response.json() as { error: string };
    expect(body).toEqual({ error: 'Backend unavailable' });
  });
});
