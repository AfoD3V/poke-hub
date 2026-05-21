import { cookies } from 'next/headers';
import type { SeriesItem } from '$shared/tcg';
import { SearchPage } from './SearchPage';

const API_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

export const metadata = { title: 'Search · PokeHub' };

export default async function Page() {
  const token = cookies().get('pokehub_session')?.value ?? '';

  const [series, chaseIds] = await Promise.all([
    fetchSeries(),
    fetchChaseIds(token),
  ]);

  return <SearchPage series={series} initialChaseIds={chaseIds} />;
}

async function fetchSeries(): Promise<SeriesItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/series`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json() as Promise<SeriesItem[]>;
  } catch { return []; }
}

async function fetchChaseIds(token: string): Promise<string[]> {
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE}/api/chase`, {
      headers: { Cookie: `pokehub_session=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const body = await res.json() as { entries: Array<{ cardId: string }> };
    return body.entries.map((e) => e.cardId);
  } catch { return []; }
}
