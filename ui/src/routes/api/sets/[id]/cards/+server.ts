import type { RequestHandler } from '@sveltejs/kit';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const GET: RequestHandler = async ({ params }) => {
	const res = await fetch(`${API_BASE}/api/sets/${encodeURIComponent(params.id!)}/cards`);
	const body = await res.text();

	return new Response(body, {
		status: res.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
