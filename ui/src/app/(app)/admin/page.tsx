import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminStats } from '$shared/admin';
import styles from './admin.module.css';

const API_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

export const metadata = { title: 'Admin · PokeHub' };

export default async function AdminPage() {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  const res = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { Cookie: `pokehub_session=${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return <AdminError message="Could not connect to backend" />;
  if (res.status === 401) redirect('/auth/login');
  if (res.status === 403) redirect('/home');
  if (!res.ok)  return <AdminError message="Failed to load stats" />;

  const stats = (await res.json()) as AdminStats;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <div className={styles['stat-grid']}>
        <Stat label="Total Users"             value={stats.totalUsers} />
        <Stat label="Collection Entries"      value={stats.totalCollectionEntries} />
        <Stat label="Chase Cards"             value={stats.totalChaseCards} />
        <Stat label="Cached Cards"            value={stats.totalCachedCards} />
      </div>
      <nav className={styles.nav}>
        <a href="/admin/users" className={styles['nav-link']}>Manage Users →</a>
        <a href="/admin/cache" className={styles['nav-link']}>Cache Management →</a>
      </nav>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles['stat-card']}>
      <p className={styles['stat-label']}>{label}</p>
      <p className={styles['stat-value']}>{value}</p>
    </div>
  );
}

function AdminError({ message }: { message: string }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <p className={styles.error}>{message}</p>
    </div>
  );
}
