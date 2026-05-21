import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { CollectionEntry, CollectionResponse, RemoveFromCollectionRequest } from '$shared/collection';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) {
		throw redirect(302, '/auth/login');
	}

	const authHeader = { Cookie: `${SESSION_COOKIE}=${token}` };

	try {
		const [collectionRes, chaseRes] = await Promise.all([
			fetch(`${API_BASE}/api/collection`, { headers: authHeader }),
			fetch(`${API_BASE}/api/chase`, { headers: authHeader })
		]);

		if (!collectionRes.ok) {
			return { entries: [] as CollectionEntry[], chaseCardIds: [] as string[], error: 'Failed to load collection' };
		}

		const body = (await collectionRes.json()) as CollectionResponse;
		const chaseBody = chaseRes.ok
			? ((await chaseRes.json()) as { entries: Array<{ cardId: string }> })
			: { entries: [] };

		return {
			entries: body.entries,
			chaseCardIds: chaseBody.entries.map((e) => e.cardId),
			error: null
		};
	} catch (e) {
		return {
			entries: [] as CollectionEntry[],
			chaseCardIds: [] as string[],
			error: e instanceof Error ? e.message : 'Network error'
		};
	}
};

export const actions: Actions = {
	remove: async ({ request, cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) throw redirect(302, '/auth/login');

		const data = await request.formData();
		const cardId = data.get('cardId');
		if (!cardId || typeof cardId !== 'string') {
			return { error: 'Missing cardId' };
		}

		const body: RemoveFromCollectionRequest = { cardId };
		const res = await fetch(`${API_BASE}/api/collection/remove`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `${SESSION_COOKIE}=${token}`
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			const json = (await res.json()) as { error: string };
			return { error: json.error ?? 'Failed to remove card' };
		}

		return { success: true };
	}
};
