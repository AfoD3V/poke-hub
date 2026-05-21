'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  severity?: ToastSeverity;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({ message, severity = 'info', duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!onDismiss || !duration) return;
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [duration, onDismiss]);

  return (
    <div
      className={`${styles.toast} ${styles[`toast--${severity}`]}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles['toast__message']}>{message}</span>
      {onDismiss && (
        <button className={styles['toast__close']} onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
