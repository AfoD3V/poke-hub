import { redirect, fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { AdminUser, AdminCollectionEntry, AdminChaseEntry } from '$shared/admin';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

export const load: PageServerLoad = async ({ cookies, params }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) throw redirect(302, '/auth/login');

	const headers = { Cookie: `${SESSION_COOKIE}=${token}` };
	const userId = params.id;

	const [userRes, collectionRes, chaseRes] = await Promise.all([
		fetch(`${API_BASE}/api/admin/users/${userId}`, { headers }),
		fetch(`${API_BASE}/api/admin/users/${userId}/collection`, { headers }),
		fetch(`${API_BASE}/api/admin/users/${userId}/chase`, { headers })
	]);

	if (userRes.status === 401) throw redirect(302, '/auth/login');
	if (userRes.status === 403) throw redirect(302, '/home');
	if (userRes.status === 404) throw error(404, 'User not found');
	if (!userRes.ok) throw error(500, 'Failed to load user');

	const user = (await userRes.json()) as AdminUser;
	const collection: AdminCollectionEntry[] = collectionRes.ok
		? ((await collectionRes.json()) as { entries: AdminCollectionEntry[] }).entries
		: [];
	const chase: AdminChaseEntry[] = chaseRes.ok
		? ((await chaseRes.json()) as { entries: AdminChaseEntry[] }).entries
		: [];

	return { user, collection, chase };
};

export const actions: Actions = {
	updateUser: async ({ request, cookies, params }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { updateError: 'Unauthorized' });

		const form = await request.formData();
		const displayName = (form.get('displayName') as string | null) ?? '';
		// getAll collects both the hidden 'false' sentinel and the checkbox 'true' when checked.
		// If 'true' is present in any position the checkbox was checked.
		const isAdmin = (form.getAll('isAdmin') as string[]).includes('true');

		const res = await fetch(`${API_BASE}/api/admin/users/${params.id}`, {
			method: 'PATCH',
			headers: {
				Cookie: `${SESSION_COOKIE}=${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ displayName: displayName || null, isAdmin })
		});

		if (!res.ok) return fail(res.status, { updateError: 'Failed to update user' });
		return { updateSuccess: true };
	},

	resetPassword: async ({ request, cookies, params }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { resetError: 'Unauthorized' });

		const form = await request.formData();
		const newPassword = form.get('newPassword') as string | null;

		if (!newPassword || newPassword.length < 8) {
			return fail(400, { resetError: 'Password must be at least 8 characters' });
		}

		const res = await fetch(`${API_BASE}/api/admin/users/${params.id}/reset-password`, {
			method: 'POST',
			headers: {
				Cookie: `${SESSION_COOKIE}=${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ newPassword })
		});

		if (!res.ok) return fail(res.status, { resetError: 'Failed to reset password' });
		return { resetSuccess: true };
	},

	deleteUser: async ({ cookies, params }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { deleteError: 'Unauthorized' });

		const res = await fetch(`${API_BASE}/api/admin/users/${params.id}`, {
			method: 'DELETE',
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) return fail(res.status, { deleteError: 'Failed to delete user' });
		throw redirect(302, '/admin/users');
	},

	removeCollectionEntry: async ({ request, cookies, params }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { collectionError: 'Unauthorized' });

		const form = await request.formData();
		const entryId = form.get('entryId') as string | null;
		if (!entryId) return fail(400, { collectionError: 'Missing entryId' });

		const res = await fetch(`${API_BASE}/api/admin/users/${params.id}/collection/${entryId}`, {
			method: 'DELETE',
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) return fail(res.status, { collectionError: 'Failed to remove entry' });
		return { collectionSuccess: true };
	},

	removeChaseEntry: async ({ request, cookies, params }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { chaseError: 'Unauthorized' });

		const form = await request.formData();
		const entryId = form.get('entryId') as string | null;
		if (!entryId) return fail(400, { chaseError: 'Missing entryId' });

		const res = await fetch(`${API_BASE}/api/admin/users/${params.id}/chase/${entryId}`, {
			method: 'DELETE',
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) return fail(res.status, { chaseError: 'Failed to remove chase entry' });
		return { chaseSuccess: true };
	}
};
