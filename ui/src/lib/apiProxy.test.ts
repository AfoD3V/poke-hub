import { describe, it, expect, vi } from 'vitest';

// Verify that apiProxy reads API_BASE_URL (not BACKEND_URL)
describe('apiProxy env var', () => {
  it('uses API_BASE_URL environment variable', async () => {
    // The module reads the env var at import time via the module-level const.
    // We verify by checking the source uses the correct name.
    // This test imports the module and checks that a request is made to API_BASE_URL.
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const originalEnv = process.env.API_BASE_URL;
    process.env.API_BASE_URL = 'http://test-api:9999';

    // Re-import the module to pick up the new env (reset modules between tests)
    vi.resetModules();
    const { proxyGet } = await import('./apiProxy');
    await proxyGet('/api/cards/search');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('http://test-api:9999'),
      expect.any(Object)
    );

    process.env.API_BASE_URL = originalEnv;
    vi.unstubAllGlobals();
  });
});
