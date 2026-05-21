import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { AdminStats } from '$shared/admin';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) throw redirect(302, '/auth/login');

	const headers = { Cookie: `${SESSION_COOKIE}=${token}` };

	const res = await fetch(`${API_BASE}/api/admin/stats`, { headers });

	if (res.status === 401) throw redirect(302, '/auth/login');
	if (res.status === 403) throw redirect(302, '/home');
	if (!res.ok) return { stats: null, error: 'Failed to load stats' };

	const stats = (await res.json()) as AdminStats;
	return { stats, error: null };
};
