'use client';

import { useEffect, useRef } from 'react';
import styles from './SlotActionToolbar.module.css';

interface Props {
  hasCard: boolean;
  onEdit: () => void;
  onClear: () => void;
  onMove: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}

export function SlotActionToolbar({ hasCard, onEdit, onClear, onMove, onCopy, onDismiss }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onDismiss]);

  return (
    <div ref={wrapRef} className={styles.toolbar} role="toolbar" aria-label="Slot actions">
      <button
        type="button"
        className={styles.action}
        onClick={onEdit}
        title="Edit (replace card)"
        aria-label="Edit slot"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      {hasCard && (
        <>
          <button
            type="button"
            className={styles.action}
            onClick={onMove}
            title="Move card"
            aria-label="Move card"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
              <polyline points="5 9 2 12 5 15"/>
              <polyline points="9 5 12 2 15 5"/>
              <polyline points="15 19 12 22 9 19"/>
              <polyline points="19 9 22 12 19 15"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
          </button>

          <button
            type="button"
            className={styles.action}
            onClick={onCopy}
            title="Copy card"
            aria-label="Copy card"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>

          <button
            type="button"
            className={`${styles.action} ${styles.danger}`}
            onClick={onClear}
            title="Clear slot"
            aria-label="Clear slot"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
