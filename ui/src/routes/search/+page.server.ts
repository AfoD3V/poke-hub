import type { PageServerLoad } from './$types';
import type { TcgSearchResponse, TcgProxyError } from '$shared/tcg';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q');

	if (!q || !q.trim()) {
		return { cards: [], totalCount: 0, query: '', error: null };
	}

	const proxyUrl = new URL(`${API_BASE}/api/cards/search`);
	proxyUrl.searchParams.set('q', q.trim());

	try {
		const res = await fetch(proxyUrl.toString());
		const body = (await res.json()) as TcgSearchResponse | TcgProxyError;

		if (!res.ok) {
			return {
				cards: [],
				totalCount: 0,
				query: q.trim(),
				error: 'error' in body ? body.error : `Search failed (${res.status})`
			};
		}

		return {
			cards: body.cards,
			totalCount: body.totalCount,
			query: q.trim(),
			error: null
		};
	} catch (e) {
		return {
			cards: [],
			totalCount: 0,
			query: q.trim(),
			error: e instanceof Error ? e.message : 'Network error'
		};
	}
};
