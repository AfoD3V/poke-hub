import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import type { Binder } from '$shared/binders';
import { BinderPageView } from './BinderPageView';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function Page({ params }: Props) {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  let binder: Binder | null = null;
  let missing = false;

  try {
    const res = await fetch(`${API_BASE}/api/binders/${params.id}`, {
      headers: { Cookie: `pokehub_session=${token}` },
      cache: 'no-store',
    });
    if (res.status === 404) {
      missing = true;
    } else if (res.ok) {
      const body = await res.json() as { binder: Binder };
      binder = body.binder;
    } else {
      throw new Error('Failed to load binder');
    }
  } catch {
    return (
      <div style={{ padding: '2rem', color: '#94a3b8' }}>
        <p>Could not load binder.</p>
      </div>
    );
  }

  if (missing) notFound();
  if (!binder) return null;
  return <BinderPageView binder={binder} />;
}
