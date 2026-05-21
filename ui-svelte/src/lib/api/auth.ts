import type { AuthLoginRequest, AuthRegisterRequest, AuthSessionResponse } from '$shared/auth';

/**
 * Base URL for the PokeHub backend API, injected via the `API_BASE_URL`
 * environment variable. Falls back to the default local dev address.
 *
 * NOTE: This module is intended for **server-side** use only (SvelteKit
 * server actions and `load` functions). Never import it in client-side code
 * — the API base URL must not be exposed to the browser.
 */
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

/**
 * Calls the backend `POST /auth/login` endpoint.
 *
 * @returns The raw `Response` so the caller can inspect the `Set-Cookie` header
 *          and forward the session cookie to the browser.
 */
export async function loginUser(payload: AuthLoginRequest): Promise<Response> {
	return fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

/**
 * Calls the backend `POST /auth/register` endpoint.
 *
 * @returns The raw `Response` so the caller can inspect the `Set-Cookie` header
 *          and forward the session cookie to the browser.
 */
export async function registerUser(payload: AuthRegisterRequest): Promise<Response> {
	return fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
}

/**
 * Calls the backend `GET /auth/session` endpoint, forwarding the provided
 * cookie header so the backend can validate the JWT.
 *
 * @param cookieHeader - The raw `Cookie` header string from the incoming
 *                       SvelteKit request (e.g. from `event.request.headers`).
 */
export async function getSession(cookieHeader: string): Promise<AuthSessionResponse> {
	const res = await fetch(`${API_BASE}/auth/session`, {
		headers: { Cookie: cookieHeader }
	});
	if (!res.ok) {
		return { user: null };
	}
	return res.json() as Promise<AuthSessionResponse>;
}
