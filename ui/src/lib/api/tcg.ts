import type { TcgSearchResponse, TcgProxyError } from '$shared/tcg';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

/**
 * Calls the backend TCG proxy search endpoint.
 *
 * @param query    Search expression forwarded to pokemontcg.io
 * @param page     Page number
 * @param pageSize Cards per page
 * @returns Search response or error payload
 */
export async function searchCards(
	query: string,
	page = 1,
	pageSize = 20
): Promise<TcgSearchResponse> {
	const url = new URL(`${API_BASE}/api/cards/search`);
	url.searchParams.set('q', query);
	url.searchParams.set('page', String(page));
	url.searchParams.set('pageSize', String(pageSize));

	const res = await fetch(url.toString());
	const body = (await res.json()) as TcgSearchResponse | TcgProxyError;

	if (!res.ok) {
		throw new Error('error' in body ? body.error : `Search failed (${res.status})`);
	}

	return body as TcgSearchResponse;
}

/**
 * Calls the backend TCG proxy for a single card by id.
 *
 * @param id Card identifier
 * @returns Card data or null if not found
 */
export async function getCardById(id: string): Promise<NonNullable<unknown> | null> {
	const res = await fetch(`${API_BASE}/api/cards/${encodeURIComponent(id)}`);
	if (res.status === 404) return null;
	if (!res.ok) {
		const body = (await res.json()) as TcgProxyError;
		throw new Error(body.error || `Card fetch failed (${res.status})`);
	}
	return res.json();
}
