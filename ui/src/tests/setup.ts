import '@testing-library/jest-dom';

// jsdom doesn't define RAF/cAF — provide stubs that survive vi.restoreAllMocks()
// These are direct property assignments (not vi.stubGlobal) so they are not restored by vitest
Object.defineProperty(global, 'requestAnimationFrame', {
  writable: true, configurable: true,
  value: (cb: FrameRequestCallback) => { setTimeout(() => cb(Date.now()), 16); return 0; },
});
Object.defineProperty(global, 'cancelAnimationFrame', {
  writable: true, configurable: true,
  value: (_id: number) => {},
});

// Mock next/navigation used by Sidebar and pages
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
  redirect: vi.fn(),
}));

// Mock next/headers used by Server Actions
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));
