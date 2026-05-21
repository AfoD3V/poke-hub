import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CollectionResponse, CollectionEntry } from '$shared/collection';
import { CollectionView } from './CollectionView';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const metadata = { title: 'Collection · PokeHub' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  const authHeader = { Cookie: `pokehub_session=${token}` };

  let entries: CollectionEntry[] = [];
  let chaseIds: string[] = [];
  let error: string | undefined;

  try {
    const [collectionRes, chaseRes] = await Promise.all([
      fetch(`${API_BASE}/api/collection`, { headers: authHeader, cache: 'no-store' }),
      fetch(`${API_BASE}/api/chase`,      { headers: authHeader, cache: 'no-store' }),
    ]);

    if (!collectionRes.ok) {
      error = 'Failed to load collection';
    } else {
      const body      = (await collectionRes.json()) as CollectionResponse;
      const chaseBody = chaseRes.ok
        ? (await chaseRes.json() as { entries: Array<{ cardId: string }> })
        : { entries: [] };
      entries  = body.entries;
      chaseIds = chaseBody.entries.map((e) => e.cardId);
    }
  } catch {
    error = 'Could not connect to backend';
  }

  return <CollectionView entries={entries} chaseIds={chaseIds} error={error} />;
}
