import type { RequestHandler } from './$types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

/**
 * POST /api/collection/add
 *
 * SvelteKit server proxy that forwards add-to-collection requests to the
 * Hono backend, passing the browser's cookie for authentication. This fixes
 * the Docker production issue where client-side fetch hits the SvelteKit node
 * server instead of Hono (no Vite dev proxy in production).
 */
export const POST: RequestHandler = async ({ request }) => {
	const cookie = request.headers.get('cookie') ?? '';
	const body = await request.text();

	try {
		const upstream = await fetch(`${API_BASE_URL}/api/collection/add`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie
			},
			body
		});

		const upstreamBody = await upstream.text();
		return new Response(upstreamBody, {
			status: upstream.status,
			headers: { 'content-type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
			status: 502,
			headers: { 'content-type': 'application/json' }
		});
	}
};
