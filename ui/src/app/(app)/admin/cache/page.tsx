import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminCacheStats } from '$shared/admin';
import styles from '../admin.module.css';

const API_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

export const metadata = { title: 'Cache · Admin · PokeHub' };

export default async function AdminCachePage() {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  const res = await fetch(`${API_BASE}/api/admin/cache`, {
    headers: { Cookie: `pokehub_session=${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return <p className={styles.error}>Could not connect to backend</p>;
  if (res.status === 401) redirect('/auth/login');
  if (res.status === 403) redirect('/home');

  const data = (await res.json()) as AdminCacheStats;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cache Management</h1>
      <div className={styles['stat-grid']}>
        <div className={styles['stat-card']}>
          <p className={styles['stat-label']}>Cached Cards</p>
          <p className={styles['stat-value']}>{data.total}</p>
        </div>
      </div>
      <p style={{ color: 'var(--ph-muted)', fontSize: '0.75rem' }}>
        Showing {data.entries?.length ?? 0} entries
      </p>
      <a href="/admin" className={styles['nav-link']} style={{ display: 'inline-block', marginTop: '1.5rem' }}>← Back to admin</a>
    </div>
  );
}
