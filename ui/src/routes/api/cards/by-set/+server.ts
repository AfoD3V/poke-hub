import type { RequestHandler } from '@sveltejs/kit';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const GET: RequestHandler = async ({ url }) => {
	const proxyUrl = new URL(`${API_BASE}/api/cards/by-set`);

	// Forward setId and cardNumber params to the Hono backend
	url.searchParams.forEach((value, key) => {
		proxyUrl.searchParams.set(key, value);
	});

	const res = await fetch(proxyUrl.toString());
	const body = await res.text();

	return new Response(body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
