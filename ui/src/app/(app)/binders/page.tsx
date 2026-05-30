import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { BinderListItem } from '$shared/binders';
import { BindersView } from './BindersView';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const metadata = { title: 'Binders · PokeHub' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  let binders: BinderListItem[] = [];

  try {
    const res = await fetch(`${API_BASE}/api/binders`, {
      headers: { Cookie: `pokehub_session=${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const body = await res.json() as { binders: BinderListItem[] };
      binders = body.binders;
    }
  } catch { /* non-fatal: render empty state */ }

  return <BindersView initialBinders={binders} />;
}
