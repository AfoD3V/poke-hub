'use client';

import type { BinderListItem } from '$shared/binders';
import styles from './BinderCard.module.css';

interface Props {
  binder: BinderListItem;
  onClick: () => void;
}

export function BinderCard({ binder, onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.card}
      onClick={onClick}
      aria-label={`Open binder ${binder.name}`}
    >
      <div className={styles.iconWrap} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{binder.name}</h3>
        <p className={styles.stat}>{binder.pageCount} {binder.pageCount === 1 ? 'page' : 'pages'}</p>
        <p className={styles.stat}>{binder.filledSlots} / {binder.totalSlots} cards</p>
      </div>
    </button>
  );
}
