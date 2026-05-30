'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const NAV_LINKS = [
  {
    href: '/home', label: 'Home',
    icon: (
      <svg className={styles['link-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    bottomIcon: (
      <svg className={styles['bottom-nav-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/search', label: 'Search',
    icon: (
      <svg className={styles['link-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    bottomIcon: (
      <svg className={styles['bottom-nav-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/collection', label: 'Collection',
    icon: (
      <svg className={styles['link-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    bottomIcon: (
      <svg className={styles['bottom-nav-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    href: '/binders', label: 'Binders',
    icon: (
      <svg className={styles['link-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    bottomIcon: (
      <svg className={styles['bottom-nav-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/home') return pathname === '/home';
  return pathname === href || pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className={styles.sidebar} aria-label="Sidebar">
        <div className={styles.brand}>
          <span className={styles['brand-poke']}>Poke</span><span className={styles['brand-hub']}>Hub</span>
        </div>

        <nav aria-label="Main navigation" className={styles.nav}>
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles['nav-link']} ${isActive(href, pathname) ? styles['nav-link-active'] : ''}`}
              aria-label={label}
              aria-current={isActive(href, pathname) ? 'page' : undefined}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.footer}>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className={styles['logout-btn']}>
              <svg className={styles['link-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom nav — always in DOM; CSS media query controls visibility */}
      <nav className={styles['bottom-nav']} aria-label="Mobile navigation">
        {NAV_LINKS.map(({ href, label, bottomIcon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles['bottom-nav-link']} ${isActive(href, pathname) ? styles['bottom-nav-link-active'] : ''}`}
            aria-label={label}
            aria-current={isActive(href, pathname) ? 'page' : undefined}
          >
            {bottomIcon}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
