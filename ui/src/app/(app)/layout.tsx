import { Sidebar } from '@/lib/components/Sidebar';
import styles from './layout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles['app-shell']}>
      <Sidebar />
      <main className={styles['app-main']}>{children}</main>
    </div>
  );
}
