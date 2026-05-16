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

async function fetchChaseCardIds(token: string): Promise<string[]> {
	if (!token) return [];
	try {
		const res = await fetch(`${API_BASE}/api/chase`, {
			headers: { Cookie: `pokehub_session=${token}` }
		});
		if (!res.ok) return [];
		const body = (await res.json()) as { entries: Array<{ cardId: string }> };
		return body.entries.map((e) => e.cardId);
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ url, cookies }) => {
	const token = cookies.get('pokehub_session') ?? '';
	const mode = url.searchParams.get('mode');

	// Pre-fetch series list and chase IDs in parallel
	const [series, chaseCardIds] = await Promise.all([
		fetchSeries(),
		fetchChaseCardIds(token)
	]);

	// ── Legacy set & number lookup (SSR deep-link compatibility) ─────────────
	if (mode === 'set') {
		const setId = url.searchParams.get('setId') ?? '';
		const cardNumber = url.searchParams.get('cardNumber') ?? '';

		if (!setId.trim() || !cardNumber.trim()) {
			return { series, chaseCardIds, cards: [], totalCount: 0, query: '', mode: 'set', setId, cardNumber, error: null };
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
					chaseCardIds,
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
				chaseCardIds,
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
				chaseCardIds,
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
		return { series, chaseCardIds, cards: [], totalCount: 0, query: '', mode: 'name', setId: '', cardNumber: '', error: null };
	}

	const proxyUrl = new URL(`${API_BASE}/api/cards/search`);
	proxyUrl.searchParams.set('q', q.trim());

	try {
		const res = await fetch(proxyUrl.toString());
		const body = (await res.json()) as TcgSearchResponse | TcgProxyError;

		if (!res.ok) {
			return {
				series,
				chaseCardIds,
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
			chaseCardIds,
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
			chaseCardIds,
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
