'use client';

import type { BinderListItem } from '$shared/binders';
import styles from './BinderCard.module.css';

export const BINDER_COLOR_MAP: Record<string, string> = {
  purple: '#7c3aed', red: '#ef4444', orange: '#f97316', amber: '#f59e0b',
  green: '#22c55e', teal: '#14b8a6', blue: '#3b82f6', pink: '#ec4899',
};

interface Props {
  binder: BinderListItem;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function BinderCard({ binder, onClick, onEdit, onDelete }: Props) {
  const accentColor = BINDER_COLOR_MAP[binder.color ?? 'purple'] ?? '#7c3aed';
  const fillPct = binder.totalSlots > 0 ? Math.round((binder.filledSlots / binder.totalSlots) * 100) : 0;

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }}}
      aria-label={`Open binder ${binder.name}`}
    >
      <div className={styles.cardTop} style={{ background: accentColor }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40" className={styles.icon} aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div className={styles.cardBottom}>
        <div className={styles.cardInfo}>
          <h3 className={styles.name}>{binder.name}</h3>
          <p className={styles.stat}>{binder.pageCount} {binder.pageCount === 1 ? 'page' : 'pages'}</p>
          <p className={styles.stat}>{binder.filledSlots} / {binder.totalSlots} cards ({fillPct}%)</p>
        </div>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onEdit}
            aria-label={`Edit ${binder.name}`}
            title="Edit binder"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={onDelete}
            aria-label={`Delete ${binder.name}`}
            title="Delete binder"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
