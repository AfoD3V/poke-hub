import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CollectionResponse } from '$shared/collection';
import type { ChaseEntry } from '$shared/tcg';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'pokehub_session';

function bucketRarity(raw: string | undefined): string {
	const r = (raw ?? '').toLowerCase().trim();
	if (!r) return 'Other';
	if (r === 'common') return 'Common';
	if (r === 'uncommon') return 'Uncommon';
	if (r === 'rare' && !r.includes('holo') && !r.includes('ultra') && !r.includes('secret')) return 'Rare';
	if (r.includes('secret') || r === 'hyper rare' || r === 'ace spec rare') return 'Secret Rare';
	if (r === 'ultra rare' || r === 'double rare' || r === 'rare ultra') return 'Ultra Rare';
	if (r === 'special illustration rare' || r === 'illustration rare') return 'Special Rare';
	if (r.includes('holo')) return 'Holo Rare';
	if (r === 'rare') return 'Rare';
	return 'Other';
}

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) {
		throw redirect(302, '/auth/login');
	}

	const authHeader = { Cookie: `${SESSION_COOKIE}=${token}` };

	try {
		const [collectionRes, chaseRes] = await Promise.all([
			fetch(`${API_BASE}/api/collection`, { headers: authHeader }),
			fetch(`${API_BASE}/api/chase`, { headers: authHeader })
		]);

		if (!collectionRes.ok) {
			return {
				totalCards: 0,
				uniquePokemon: 0,
				setBreakdown: [],
				rarityBreakdown: {} as Record<string, number>,
				chaseEntries: [] as ChaseEntry[],
				setLogos: {} as Record<string, string>,
				setNames: {} as Record<string, string>,
				error: 'Failed to load stats'
			};
		}

		const body = (await collectionRes.json()) as CollectionResponse;
		const entries = body.entries ?? [];

		const totalCards = entries.reduce((sum, e) => sum + (e.quantity ?? 1), 0);
		const uniquePokemon = new Set(entries.map((e) => e.card.name)).size;

		// Per-set breakdown
		const setCountMap = new Map<string, number>();
		for (const e of entries) {
			const setName = e.card.setDetails?.name ?? e.card.set ?? 'Unknown';
			setCountMap.set(setName, (setCountMap.get(setName) ?? 0) + (e.quantity ?? 1));
		}
		const setBreakdown = Array.from(setCountMap.entries())
			.map(([setName, count]) => ({ setName, count }))
			.sort((a, b) => b.count - a.count);

		// Rarity breakdown
		const rarityMap = new Map<string, number>();
		for (const e of entries) {
			const bucket = bucketRarity(e.card.rarity);
			rarityMap.set(bucket, (rarityMap.get(bucket) ?? 0) + (e.quantity ?? 1));
		}
		const rarityBreakdown = Object.fromEntries(rarityMap.entries());

		// Chase entries
		const chaseEntries: ChaseEntry[] = chaseRes.ok
			? ((await chaseRes.json()) as { entries: ChaseEntry[] }).entries ?? []
			: [];

		// Derive setId from cardId when snapshot.setId is empty (e.g. "sv01-001" → "sv01")
		function resolveSetId(entry: ChaseEntry): string {
			if (entry.cardSnapshot.setId) return entry.cardSnapshot.setId;
			const lastDash = entry.cardId.lastIndexOf('-');
			return lastDash > 0 ? entry.cardId.slice(0, lastDash) : '';
		}

		// Resolve set info (name + logo) for all unique setIds in the chase list
		const uniqueSetIds = [...new Set(chaseEntries.map(resolveSetId).filter(Boolean))];
		const infoResults = await Promise.allSettled(
			uniqueSetIds.map((setId) =>
				fetch(`${API_BASE}/api/sets/${encodeURIComponent(setId)}/info`, { headers: authHeader })
					.then((r) => r.ok ? r.json() as Promise<{ id: string; name: string; logo: string }> : Promise.resolve({ id: setId, name: '', logo: '' }))
					.catch(() => ({ id: setId, name: '', logo: '' }))
			)
		);
		const setLogos: Record<string, string> = {};
		const setNames: Record<string, string> = {};
		for (const result of infoResults) {
			if (result.status === 'fulfilled') {
				setLogos[result.value.id] = result.value.logo;
				if (result.value.name) setNames[result.value.id] = result.value.name;
			}
		}

		// Patch empty setName in chase entries using the resolved names
		for (const entry of chaseEntries) {
			if (!entry.cardSnapshot.setName) {
				const sid = resolveSetId(entry);
				if (sid && setNames[sid]) entry.cardSnapshot.setName = setNames[sid];
			}
		}

		return {
			totalCards,
			uniquePokemon,
			setBreakdown,
			rarityBreakdown,
			chaseEntries,
			setLogos,
			setNames,
			error: null
		};
	} catch (e) {
		return {
			totalCards: 0,
			uniquePokemon: 0,
			setBreakdown: [],
			rarityBreakdown: {} as Record<string, number>,
			chaseEntries: [] as ChaseEntry[],
			setLogos: {} as Record<string, string>,
			setNames: {} as Record<string, string>,
			error: e instanceof Error ? e.message : 'Network error'
		};
	}
};
