import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { mockRedirect(url); throw new Error(`NEXT_REDIRECT:${url}`); },
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock next/headers cookies
const mockCookiesSet = vi.fn();
const mockCookiesDelete = vi.fn();
const mockCookiesGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: mockCookiesSet,
    delete: mockCookiesDelete,
    get: mockCookiesGet,
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('login action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets cookie and redirects on successful login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => name === 'set-cookie'
          ? 'pokehub_session=jwt.token.here; Path=/; HttpOnly; SameSite=Strict'
          : null,
      },
    });

    const { login } = await import('@/app/auth/login/actions');
    const formData = new FormData();
    formData.set('email', 'test@example.com');
    formData.set('password', 'password123');

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT:/home');
    expect(mockCookiesSet).toHaveBeenCalledWith(
      'pokehub_session',
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
  });

  it('returns error message on invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
      headers: { get: () => null },
    });

    const { login } = await import('@/app/auth/login/actions');
    const formData = new FormData();
    formData.set('email', 'wrong@example.com');
    formData.set('password', 'wrongpass');

    const result = await login(formData);
    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }));
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });
});

describe('register action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets cookie and redirects on successful registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: {
        get: (name: string) => name === 'set-cookie'
          ? 'pokehub_session=new.jwt.token; Path=/; HttpOnly; SameSite=Strict'
          : null,
      },
    });

    const { register } = await import('@/app/auth/register/actions');
    const formData = new FormData();
    formData.set('email', 'new@example.com');
    formData.set('password', 'password123');
    formData.set('name', 'New User');

    await expect(register(formData)).rejects.toThrow('NEXT_REDIRECT:/home');
    expect(mockCookiesSet).toHaveBeenCalled();
  });

  it('returns error on duplicate email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'Email already exists' }),
      headers: { get: () => null },
    });

    const { register } = await import('@/app/auth/register/actions');
    const formData = new FormData();
    formData.set('email', 'existing@example.com');
    formData.set('password', 'password123');
    formData.set('name', 'Duplicate');

    const result = await register(formData);
    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});

describe('logout action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes cookie and redirects to /auth/login', async () => {
    const { logout } = await import('@/app/auth/logout/actions');
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT:/auth/login');
    expect(mockCookiesDelete).toHaveBeenCalledWith('pokehub_session');
  });
});
