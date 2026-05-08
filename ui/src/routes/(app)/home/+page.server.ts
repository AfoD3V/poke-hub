import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CollectionResponse } from '$shared/collection';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) {
		throw redirect(302, '/auth/login');
	}

	try {
		const res = await fetch(`${API_BASE}/api/collection`, {
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) {
			return { totalCards: 0, uniquePokemon: 0, error: 'Failed to load stats' };
		}

		const body = (await res.json()) as CollectionResponse;
		const entries = body.entries ?? [];
		const totalCards = entries.reduce((sum, e) => sum + (e.quantity ?? 1), 0);
		const uniquePokemon = new Set(entries.map((e) => e.card.name)).size;

		return { totalCards, uniquePokemon, error: null };
	} catch (e) {
		return {
			totalCards: 0,
			uniquePokemon: 0,
			error: e instanceof Error ? e.message : 'Network error'
		};
	}
};
