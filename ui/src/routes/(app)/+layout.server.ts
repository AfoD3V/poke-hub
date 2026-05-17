import type { LayoutServerLoad } from './$types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('pokehub_session');
	if (!token) return { isAdmin: false };

	try {
		const res = await fetch(`${API_BASE}/api/admin/stats`, {
			headers: { Cookie: `pokehub_session=${token}` }
		});
		return { isAdmin: res.status === 200 };
	} catch {
		return { isAdmin: false };
	}
};
