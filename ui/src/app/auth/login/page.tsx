import styles from '../auth.module.css';

export const metadata = { title: 'Sign In — PokeHub' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className={styles['auth-card']}>
      <div className={styles['auth-card__header']}>
        <h1 className={styles['auth-card__title']}>Welcome back</h1>
        <p className={styles['auth-card__subtitle']}>Sign in to your collection</p>
      </div>

      {searchParams.error && (
        <div className={styles['auth-error']} role="alert">
          {searchParams.error}
        </div>
      )}

      <form action="/api/auth/login" method="POST" className={styles['auth-form']}>
        <div className={styles['auth-field']}>
          <label htmlFor="email" className={styles['auth-label']}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={styles['auth-input']}
            placeholder="you@example.com"
          />
        </div>

        <div className={styles['auth-field']}>
          <label htmlFor="password" className={styles['auth-label']}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={styles['auth-input']}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className={styles['auth-submit']}>
          Sign In
        </button>
      </form>

      <p className={styles['auth-footer']}>
        No account?{' '}
        <a href="/auth/register" className={styles['auth-link']}>Create one</a>
      </p>
    </div>
  );
}
