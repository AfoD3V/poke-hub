import type { RequestHandler } from './$types';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

/** POST /api/chase/add — proxy to Hono backend with auth cookie forwarding. */
export const POST: RequestHandler = async ({ request }) => {
	const cookie = request.headers.get('cookie') ?? '';
	const body = await request.text();

	try {
		const upstream = await fetch(`${API_BASE_URL}/api/chase/add`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', cookie },
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
