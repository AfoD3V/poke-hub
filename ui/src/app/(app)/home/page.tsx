import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CollectionResponse } from '$shared/collection';
import type { ChaseEntry } from '$shared/tcg';
import { HomeDashboard } from './HomeDashboard';
import type { HomeDashboardProps } from './HomeDashboard';

const API_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

function bucketRarity(raw: string | undefined): string {
  const r = (raw ?? '').toLowerCase().trim();
  if (!r) return 'Other';
  if (r === 'common') return 'Common';
  if (r === 'uncommon') return 'Uncommon';
  if (r.includes('secret') || r === 'hyper rare' || r === 'ace spec rare') return 'Secret Rare';
  if (r === 'ultra rare' || r === 'double rare' || r === 'rare ultra') return 'Ultra Rare';
  if (r === 'special illustration rare' || r === 'illustration rare') return 'Special Rare';
  if (r.includes('holo')) return 'Holo Rare';
  if (r === 'rare') return 'Rare';
  return 'Other';
}

function resolveSetId(entry: ChaseEntry): string {
  if (entry.cardSnapshot.setId) return entry.cardSnapshot.setId;
  const lastDash = entry.cardId.lastIndexOf('-');
  return lastDash > 0 ? entry.cardId.slice(0, lastDash) : '';
}

const EMPTY_PROPS: Omit<HomeDashboardProps, 'error'> = {
  totalCards: 0, uniquePokemon: 0, setBreakdown: [],
  rarityBreakdown: {}, chaseEntries: [], setLogos: {}, setNames: {},
};

export const metadata = { title: 'Home · PokeHub' };

export default async function HomePage() {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  const authHeader = { Cookie: `pokehub_session=${token}` };

  let props: HomeDashboardProps;

  try {
    const [collectionRes, chaseRes] = await Promise.all([
      fetch(`${API_BASE}/api/collection`, { headers: authHeader, cache: 'no-store' }),
      fetch(`${API_BASE}/api/chase`,      { headers: authHeader, cache: 'no-store' }),
    ]);

    if (!collectionRes.ok) {
      props = { ...EMPTY_PROPS, error: 'Failed to load stats' };
    } else {
      const body    = (await collectionRes.json()) as CollectionResponse;
      const entries = body.entries ?? [];

      const totalCards    = entries.reduce((sum, e) => sum + (e.quantity ?? 1), 0);
      const uniquePokemon = new Set(entries.map((e) => e.card.name)).size;

      const setCountMap = new Map<string, number>();

      for (const e of entries) {
        const setName = e.card.setDetails?.name ?? e.card.set ?? 'Unknown';
        setCountMap.set(setName, (setCountMap.get(setName) ?? 0) + (e.quantity ?? 1));
      }

      const setBreakdown = Array.from(setCountMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const rarityBreakdown: Record<string, number> = {};
      for (const e of entries) {
        const bucket = bucketRarity(e.card.rarity);
        rarityBreakdown[bucket] = (rarityBreakdown[bucket] ?? 0) + (e.quantity ?? 1);
      }

      const chaseEntries: ChaseEntry[] = chaseRes.ok
        ? ((await chaseRes.json()) as { entries?: ChaseEntry[] }).entries ?? []
        : [];

      // Resolve set logos for each unique set in the chase list
      const uniqueSetIds = Array.from(new Set(chaseEntries.map(resolveSetId).filter(Boolean)));
      const infoResults = await Promise.allSettled(
        uniqueSetIds.map((setId) =>
          fetch(`${API_BASE}/api/sets/${encodeURIComponent(setId)}/info`, {
            headers: authHeader, cache: 'no-store',
          })
            .then((r) => r.ok
              ? r.json() as Promise<{ id: string; name: string; logo: string }>
              : Promise.resolve({ id: setId, name: '', logo: '' }))
            .catch(() => ({ id: setId, name: '', logo: '' })),
        ),
      );

      const setLogos: Record<string, string> = {};
      const setNames: Record<string, string> = {};
      for (const result of infoResults) {
        if (result.status === 'fulfilled') {
          setLogos[result.value.id] = result.value.logo;
          if (result.value.name) setNames[result.value.id] = result.value.name;
        }
      }

      // Patch missing setName in chase entries
      for (const entry of chaseEntries) {
        if (!entry.cardSnapshot.setName) {
          const sid = resolveSetId(entry);
          if (sid && setNames[sid]) entry.cardSnapshot.setName = setNames[sid];
        }
      }

      props = {
        totalCards, uniquePokemon, setBreakdown, rarityBreakdown, chaseEntries,
        setLogos, setNames,
      };
    }
  } catch {
    props = { ...EMPTY_PROPS, error: 'Could not connect to backend' };
  }

  return <HomeDashboard {...props} />;
}
