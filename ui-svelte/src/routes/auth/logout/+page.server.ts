import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const SESSION_COOKIE = 'pokehub_session';

export const actions: Actions = {
	default: ({ cookies }) => {
		cookies.delete(SESSION_COOKIE, { path: '/' });
		throw redirect(302, '/auth/login');
	}
};
