import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { AuthLoginRequest } from '$shared/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

const SESSION_COOKIE = 'pokehub_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function extractJwtFromSetCookie(setCookieHeader: string): string | null {
	const match = setCookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
	return match ? match[1] : null;
}

export const load = ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		throw redirect(302, '/home');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim();
		const password = data.get('password')?.toString().trim();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const body: AuthLoginRequest = { email, password };

		let res: Response;
		try {
			res = await fetch(`${API_BASE}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
		} catch {
			return fail(503, { error: 'Could not reach the server. Try again shortly.', email });
		}

		if (!res.ok) {
			const json = await res.json().catch(() => ({ error: 'Login failed' })) as { error?: string };
			return fail(res.status, { error: json.error ?? 'Login failed', email });
		}

		const setCookieHeader = res.headers.get('set-cookie');
		if (setCookieHeader) {
			const jwt = extractJwtFromSetCookie(setCookieHeader);
			if (jwt) {
				cookies.set(SESSION_COOKIE, jwt, {
					httpOnly: true,
					path: '/',
					sameSite: 'strict',
					maxAge: COOKIE_MAX_AGE,
					secure: process.env.NODE_ENV === 'production'
				});
			}
		}

		throw redirect(302, '/home');
	}
};
