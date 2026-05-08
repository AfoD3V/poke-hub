import { redirect } from '@sveltejs/kit';

/** Cookie name must match the backend's `authConfig.cookieName`. */
const SESSION_COOKIE = 'pokehub_session';

export const load = ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		throw redirect(302, '/home');
	}
	throw redirect(302, '/auth/login');
};
