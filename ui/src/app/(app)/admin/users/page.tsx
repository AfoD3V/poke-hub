import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminUsersResponse, AdminUser } from '$shared/admin';
import styles from '../admin.module.css';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export const metadata = { title: 'Users · Admin · PokeHub' };

export default async function AdminUsersPage() {
  const token = cookies().get('pokehub_session')?.value;
  if (!token) redirect('/auth/login');

  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { Cookie: `pokehub_session=${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return <p className={styles.error}>Could not connect to backend</p>;
  if (res.status === 401) redirect('/auth/login');
  if (res.status === 403) redirect('/home');

  const body  = (await res.json()) as AdminUsersResponse;
  const users = body.users ?? [];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Users ({body.total})</h1>
      <table>
        <thead>
          <tr>
            <th>Email</th><th>Admin</th><th>Collection</th><th>Chase</th><th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: AdminUser) => (
            <tr key={u.id}>
              <td><a href={`/admin/users/${u.id}`} className={styles['nav-link']}>{u.email}</a></td>
              <td>{u.isAdmin ? 'Yes' : 'No'}</td>
              <td>{u.collectionCount}</td>
              <td>{u.chaseCount}</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
