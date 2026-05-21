import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminUserDetail } from '$shared/admin';
import styles from '../../admin.module.css';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const metadata = { title: 'User Detail · Admin · PokeHub' };

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(params.id)}`, {
    headers: { Cookie: `pokehub_session=${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return <p className={styles.error}>Could not connect to backend</p>;
  if (res.status === 401) redirect('/auth/login');
  if (res.status === 403) redirect('/home');
  if (res.status === 404) return <p className={styles.error}>User not found</p>;

  const user = (await res.json()) as AdminUserDetail;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{user.email}</h1>
      <div className={styles['stat-grid']}>
        <div className={styles['stat-card']}>
          <p className={styles['stat-label']}>Collection</p>
          <p className={styles['stat-value']}>{user.collectionCount}</p>
        </div>
        <div className={styles['stat-card']}>
          <p className={styles['stat-label']}>Chase Cards</p>
          <p className={styles['stat-value']}>{user.chaseCount}</p>
        </div>
      </div>
      <p style={{ color: 'var(--ph-muted)', fontSize: '0.875rem' }}>
        Admin: {user.isAdmin ? 'Yes' : 'No'} &middot; Joined: {new Date(user.createdAt).toLocaleDateString()}
      </p>
      <a href="/admin/users" className={styles['nav-link']} style={{ display: 'inline-block', marginTop: '1.5rem' }}>← Back to users</a>
    </div>
  );
}
