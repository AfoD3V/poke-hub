'use client';

import { useState, useEffect, useRef } from 'react';
import type { BinderListItem } from '$shared/binders';
import styles from './CreateEditBinderModal.module.css';

const ICONS = [
  { id: 'book-open', label: 'Book', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { id: 'star', label: 'Star', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id: 'heart', label: 'Heart', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { id: 'flame', label: 'Fire', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  { id: 'droplets', label: 'Water', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a5 5 0 0 0 4.56-5.42z"/></svg> },
  { id: 'zap', label: 'Electric', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { id: 'leaf', label: 'Grass', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg> },
  { id: 'trophy', label: 'Trophy', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
  { id: 'gem', label: 'Rare', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polygon points="6 3 18 3 22 9 12 22 2 9"/><polyline points="22 9 12 9 6 3"/><line x1="12" y1="22" x2="12" y2="9"/></svg> },
  { id: 'shield', label: 'Defense', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
];

const GRID_SIZES = [
  { label: '3×3', cols: 3, rows: 3 },
  { label: '4×4', cols: 4, rows: 4 },
];

interface Props {
  binder?: BinderListItem;
  onSave: (data: { name: string; icon: string; gridCols: number; gridRows: number }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function CreateEditBinderModal({ binder, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(binder?.name ?? '');
  const [icon, setIcon] = useState(binder?.icon ?? 'book-open');
  const [gridCols, setGridCols] = useState(binder?.gridCols ?? 4);
  const [gridRows, setGridRows] = useState(binder?.gridRows ?? 4);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const isEdit = !!binder;

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), icon, gridCols, gridRows });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm('Delete this binder? All cards inside will be lost.')) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      setError('Failed to delete binder');
    } finally {
      setDeleting(false);
    }
  }

  const selectedSize = GRID_SIZES.find((s) => s.cols === gridCols && s.rows === gridRows) ?? GRID_SIZES[1];

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit binder' : 'Create binder'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.panel}>
        <h2 className={styles.title}>{isEdit ? 'Modify my binder' : 'New binder'}</h2>

        <label className={styles.label} htmlFor="binder-name">Binder name</label>
        <input
          id="binder-name"
          ref={nameRef}
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pokedex"
          maxLength={64}
        />

        <div className={styles.row}>
          <div className={styles.col}>
            <label className={styles.label} htmlFor="binder-icon">Icon</label>
            <select
              id="binder-icon"
              className={styles.select}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            >
              {ICONS.map((ic) => (
                <option key={ic.id} value={ic.id}>{ic.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.col}>
            <label className={styles.label} htmlFor="binder-size">Size</label>
            <select
              id="binder-size"
              className={styles.select}
              value={selectedSize.label}
              onChange={(e) => {
                const found = GRID_SIZES.find((s) => s.label === e.target.value);
                if (found) { setGridCols(found.cols); setGridRows(found.rows); }
              }}
            >
              {GRID_SIZES.map((s) => (
                <option key={s.label} value={s.label}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        {isEdit && onDelete && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete my binder'}
          </button>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving || deleting}>
            Cancel
          </button>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving || deleting}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
