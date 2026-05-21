import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { AdminCacheStats } from '$shared/admin';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) throw redirect(302, '/auth/login');

	const res = await fetch(`${API_BASE}/api/admin/cache`, {
		headers: { Cookie: `${SESSION_COOKIE}=${token}` }
	});

	if (res.status === 401) throw redirect(302, '/auth/login');
	if (res.status === 403) throw redirect(302, '/home');
	if (!res.ok) return { cache: null, error: 'Failed to load cache stats' };

	const cache = (await res.json()) as AdminCacheStats;
	return { cache, error: null };
};

export const actions: Actions = {
	flushAll: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { flushError: 'Unauthorized' });

		const res = await fetch(`${API_BASE}/api/admin/cache`, {
			method: 'DELETE',
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) return fail(res.status, { flushError: 'Failed to flush cache' });
		const body = (await res.json()) as { deleted: number };
		return { flushSuccess: true, deleted: body.deleted };
	},

	flushEntry: async ({ request, cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { flushError: 'Unauthorized' });

		const form = await request.formData();
		const cardId = form.get('cardId') as string | null;
		if (!cardId) return fail(400, { flushError: 'Missing cardId' });

		const res = await fetch(`${API_BASE}/api/admin/cache/${encodeURIComponent(cardId)}`, {
			method: 'DELETE',
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (res.status === 404) return fail(404, { flushError: 'Cache entry not found' });
		if (!res.ok) return fail(res.status, { flushError: 'Failed to flush entry' });
		return { flushEntrySuccess: true, cardId };
	}
};
