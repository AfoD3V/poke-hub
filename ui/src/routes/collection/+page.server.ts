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

	try {
		const res = await fetch(`${API_BASE}/api/collection`, {
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) {
			return { entries: [] as CollectionEntry[], error: 'Failed to load collection' };
		}

		const body = (await res.json()) as CollectionResponse;
		return { entries: body.entries, error: null };
	} catch (e) {
		return {
			entries: [] as CollectionEntry[],
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
