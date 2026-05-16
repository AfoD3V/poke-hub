import type { PageServerLoad } from './$types';
import type { TcgSearchResponse, TcgProxyError, TcgCard, SeriesItem } from '$shared/tcg';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

async function fetchSeries(): Promise<SeriesItem[]> {
	try {
		const res = await fetch(`${API_BASE}/api/series`);
		if (!res.ok) return [];
		return (await res.json()) as SeriesItem[];
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode');

	// Always pre-fetch series list for the By Series tab (cached 24h on backend)
	const series = await fetchSeries();

	// ── Legacy set & number lookup (SSR deep-link compatibility) ─────────────
	if (mode === 'set') {
		const setId = url.searchParams.get('setId') ?? '';
		const cardNumber = url.searchParams.get('cardNumber') ?? '';

		if (!setId.trim() || !cardNumber.trim()) {
			return { series, cards: [], totalCount: 0, query: '', mode: 'set', setId, cardNumber, error: null };
		}

		const proxyUrl = new URL(`${API_BASE}/api/cards/by-set`);
		proxyUrl.searchParams.set('setId', setId.trim());
		proxyUrl.searchParams.set('cardNumber', cardNumber.trim());

		try {
			const res = await fetch(proxyUrl.toString());
			const body = (await res.json()) as TcgCard | TcgProxyError;

			if (!res.ok) {
				return {
					series,
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
				series,
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
				series,
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
		return { series, cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null };
	}

	const proxyUrl = new URL(`${API_BASE}/api/cards/search`);
	proxyUrl.searchParams.set('q', q.trim());

	try {
		const res = await fetch(proxyUrl.toString());
		const body = (await res.json()) as TcgSearchResponse | TcgProxyError;

		if (!res.ok) {
			return {
				series,
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
			series,
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
			series,
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
