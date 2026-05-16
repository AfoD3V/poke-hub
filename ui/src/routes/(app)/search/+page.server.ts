import type { PageServerLoad } from './$types';
import type { TcgSearchResponse, TcgProxyError, TcgCard } from '$shared/tcg';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const load: PageServerLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode');

	// ── Set & number lookup (SSR) ────────────────────────────────────────────
	if (mode === 'set') {
		const setId = url.searchParams.get('setId') ?? '';
		const cardNumber = url.searchParams.get('cardNumber') ?? '';

		if (!setId.trim() || !cardNumber.trim()) {
			return { cards: [], totalCount: 0, query: '', mode: 'set', setId, cardNumber, error: null };
		}

		const proxyUrl = new URL(`${API_BASE}/api/cards/by-set`);
		proxyUrl.searchParams.set('setId', setId.trim());
		proxyUrl.searchParams.set('cardNumber', cardNumber.trim());

		try {
			const res = await fetch(proxyUrl.toString());
			const body = (await res.json()) as TcgCard | TcgProxyError;

			if (!res.ok) {
				return {
					cards: [],
					totalCount: 0,
					query: '',
					mode: 'set',
					setId,
					cardNumber,
					error: 'error' in body ? body.error : `Lookup failed (${res.status})`
				};
			}

			const card = body as TcgCard;
			return {
				cards: [card],
				totalCount: 1,
				query: '',
				mode: 'set',
				setId,
				cardNumber,
				error: null
			};
		} catch (e) {
			return {
				cards: [],
				totalCount: 0,
				query: '',
				mode: 'set',
				setId,
				cardNumber,
				error: e instanceof Error ? e.message : 'Network error'
			};
		}
	}

	// ── Name search (SSR) ────────────────────────────────────────────────────
	const q = url.searchParams.get('q');

	if (!q || !q.trim()) {
		return { cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null };
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
				mode: 'name',
				setId: '',
				cardNumber: '',
				error: 'error' in body ? body.error : `Search failed (${res.status})`
			};
		}

		const success = body as TcgSearchResponse;
		return {
			cards: success.cards,
			totalCount: success.totalCount,
			query: q.trim(),
			mode: 'name',
			setId: '',
			cardNumber: '',
			error: null
		};
	} catch (e) {
		return {
			cards: [],
			totalCount: 0,
			query: q.trim(),
			mode: 'name',
			setId: '',
			cardNumber: '',
			error: e instanceof Error ? e.message : 'Network error'
		};
	}
};
