import styles from '../auth.module.css';

export const metadata = { title: 'Create Account — PokeHub' };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className={styles['auth-card']}>
      <div className={styles['auth-card__header']}>
        <h1 className={styles['auth-card__title']}>Create account</h1>
        <p className={styles['auth-card__subtitle']}>Start tracking your collection</p>
      </div>

      {searchParams.error && (
        <div className={styles['auth-error']} role="alert">
          {searchParams.error}
        </div>
      )}

      <form action="/api/auth/register" method="POST" className={styles['auth-form']}>
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
            autoComplete="new-password"
            className={styles['auth-input']}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className={styles['auth-submit']}>
          Create Account
        </button>
      </form>

      <p className={styles['auth-footer']}>
        Already have an account?{' '}
        <a href="/auth/login" className={styles['auth-link']}>Sign in</a>
      </p>
    </div>
  );
}
