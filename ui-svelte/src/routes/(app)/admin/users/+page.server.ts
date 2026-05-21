import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { AdminUsersResponse } from '$shared/admin';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) throw redirect(302, '/auth/login');

	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const pageSize = 20;
	const headers = { Cookie: `${SESSION_COOKIE}=${token}` };

	const res = await fetch(
		`${API_BASE}/api/admin/users?page=${page}&pageSize=${pageSize}`,
		{ headers }
	);

	if (res.status === 401) throw redirect(302, '/auth/login');
	if (res.status === 403) throw redirect(302, '/home');
	if (!res.ok) return { users: [], total: 0, page, pageSize, error: 'Failed to load users' };

	const body = (await res.json()) as AdminUsersResponse;
	return { users: body.users, total: body.total, page, pageSize, error: null };
};

export const actions: Actions = {
	deleteUser: async ({ request, cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (!token) return fail(401, { error: 'Unauthorized' });

		const form = await request.formData();
		const userId = form.get('userId');
		if (!userId || typeof userId !== 'string') return fail(400, { error: 'Missing userId' });

		const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
			method: 'DELETE',
			headers: { Cookie: `${SESSION_COOKIE}=${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete user' });
		return { success: true };
	}
};
