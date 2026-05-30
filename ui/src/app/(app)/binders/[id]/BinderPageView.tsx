'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Binder, BinderPage, CardSnapshot } from '$shared/binders';
import { BinderGrid } from '@/lib/components/BinderGrid';
import { AddCardModal } from '@/lib/components/AddCardModal';
import { CreateEditBinderModal } from '@/lib/components/CreateEditBinderModal';
import { placeCard, clearSlot, moveCard, copyCard, addPage, updateBinder, deleteBinder } from '@/lib/api/binders';
import styles from './BinderPageView.module.css';

interface Props {
  binder: Binder;
}

type Mode = 'normal' | 'move' | 'copy';

export function BinderPageView({ binder: initialBinder }: Props) {
  const router = useRouter();
  const [binder, setBinder] = useState(initialBinder);
  const [pageIndex, setPageIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('normal');
  /** Slot selected as source in move/copy mode */
  const [moveSourceSlot, setMoveSourceSlot] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentPage: BinderPage | undefined = binder.pages[pageIndex];
  const totalPages = binder.pages.length;

  async function refreshBinder() {
    try {
      const res = await fetch(`/api/binders/${binder.id}`, { cache: 'no-store' });
      if (res.ok) {
        const body = await res.json() as { binder: Binder };
        setBinder(body.binder);
      }
    } catch { /* non-fatal */ }
  }

  const handleSlotClick = useCallback(async (slotIndex: number) => {
    if (!currentPage) return;

    // Move mode: clicking destination executes the move
    if (mode === 'move' && moveSourceSlot !== null) {
      if (slotIndex === moveSourceSlot) { setMode('normal'); setMoveSourceSlot(null); return; }
      setSaving(true);
      try {
        await moveCard(binder.id, currentPage.id, moveSourceSlot, {
          fromPageId: currentPage.id, fromSlotIndex: moveSourceSlot,
          toPageId: currentPage.id, toSlotIndex: slotIndex,
        });
        await refreshBinder();
      } finally { setSaving(false); setMode('normal'); setMoveSourceSlot(null); }
      return;
    }

    // Copy mode: clicking destination executes the copy
    if (mode === 'copy' && moveSourceSlot !== null) {
      if (slotIndex === moveSourceSlot) { setMode('normal'); setMoveSourceSlot(null); return; }
      setSaving(true);
      try {
        await copyCard(binder.id, currentPage.id, moveSourceSlot, {
          toPageId: currentPage.id, toSlotIndex: slotIndex,
        });
        await refreshBinder();
      } finally { setSaving(false); setMode('normal'); setMoveSourceSlot(null); }
      return;
    }

    // Normal mode: open AddCardModal immediately (add or replace)
    setPendingSlot(slotIndex);
    setShowAddModal(true);
  }, [binder.id, currentPage, mode, moveSourceSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleClearSlot(slotIndex: number) {
    if (!currentPage) return;
    setSaving(true);
    try {
      await clearSlot(binder.id, currentPage.id, slotIndex);
      await refreshBinder();
    } finally { setSaving(false); }
  }

  async function handleDragDrop(fromSlotIndex: number, toSlotIndex: number) {
    if (!currentPage) return;
    setSaving(true);
    try {
      await moveCard(binder.id, currentPage.id, fromSlotIndex, {
        fromPageId: currentPage.id, fromSlotIndex,
        toPageId: currentPage.id, toSlotIndex,
      });
      await refreshBinder();
    } finally { setSaving(false); }
  }

  async function handleCardSelect(snapshot: CardSnapshot) {
    if (pendingSlot === null || !currentPage) return;
    setSaving(true);
    try {
      await placeCard(binder.id, currentPage.id, pendingSlot, {
        cardId: snapshot.setId + '-' + snapshot.name.toLowerCase().replace(/\s+/g, '-'),
        cardSnapshot: snapshot,
      });
      await refreshBinder();
    } finally { setSaving(false); setPendingSlot(null); }
  }

  async function handleAddPage() {
    setSaving(true);
    try {
      await addPage(binder.id);
      await refreshBinder();
      setPageIndex(binder.pages.length);
    } finally { setSaving(false); }
  }

  async function handleSaveBinder(data: { name: string; icon: string; gridCols: number; gridRows: number }) {
    await updateBinder(binder.id, data);
    await refreshBinder();
  }

  async function handleDeleteBinder() {
    await deleteBinder(binder.id);
    router.push('/binders');
  }

  function cancelMode() {
    setMode('normal');
    setMoveSourceSlot(null);
  }

  return (
    <div className={styles.container}>
      {/* Sticky top bar: back + mode + page nav + settings */}
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => router.push('/binders')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span className={styles.binderName}>{binder.name}</span>
        </button>

        {mode !== 'normal' && (
          <div className={styles.modePill}>
            <span>{mode === 'move' ? 'Move — pick destination' : 'Copy — pick destination'}</span>
            <button type="button" className={styles.modeCancelBtn} onClick={cancelMode}>Cancel</button>
          </div>
        )}

        <div className={styles.navGroup}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={pageIndex === 0}
            aria-label="Previous page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <span className={styles.pageLabel}>{pageIndex + 1} / {totalPages}</span>

          <button
            type="button"
            className={styles.navBtn}
            onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={pageIndex === totalPages - 1}
            aria-label="Next page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          <button
            type="button"
            className={styles.settingsBtn}
            onClick={() => setShowEditModal(true)}
            aria-label="Binder settings"
            title="Binder settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          <button
            type="button"
            className={styles.addPageBtn}
            onClick={handleAddPage}
            disabled={saving}
            title="Add page"
          >
            + Page
          </button>
        </div>
      </div>

      {currentPage ? (
        <BinderGrid
          page={currentPage}
          gridCols={binder.gridCols}
          gridRows={binder.gridRows}
          onSlotClick={handleSlotClick}
          onClearSlot={handleClearSlot}
          onDragDrop={handleDragDrop}
          selectedSlot={moveSourceSlot}
        />
      ) : (
        <div className={styles.emptyPage}>
          <p>No pages yet</p>
          <button type="button" className={styles.emptyAddPageBtn} onClick={handleAddPage} disabled={saving}>
            Add first page
          </button>
        </div>
      )}

      {showAddModal && (
        <AddCardModal
          onSelect={handleCardSelect}
          onClose={() => { setShowAddModal(false); setPendingSlot(null); }}
        />
      )}

      {showEditModal && (
        <CreateEditBinderModal
          binder={{ id: binder.id, name: binder.name, icon: binder.icon, gridCols: binder.gridCols, gridRows: binder.gridRows, pageCount: binder.pages.length, filledSlots: 0, totalSlots: 0, estimatedValue: 0, createdAt: binder.createdAt, updatedAt: binder.updatedAt }}
          onSave={handleSaveBinder}
          onDelete={handleDeleteBinder}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
