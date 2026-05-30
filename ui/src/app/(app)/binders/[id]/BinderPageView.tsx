'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Binder, BinderPage, CardSnapshot } from '$shared/binders';
import { BinderGrid } from '@/lib/components/BinderGrid';
import { SlotActionToolbar } from '@/lib/components/SlotActionToolbar';
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
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('normal');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentPage: BinderPage | undefined = binder.pages[pageIndex];
  const totalPages = binder.pages.length;

  function getSlot(slotIndex: number) {
    return currentPage?.slots.find((s) => s.slotIndex === slotIndex) ?? null;
  }

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

    if (mode === 'move' && selectedSlot !== null) {
      if (slotIndex === selectedSlot) { setMode('normal'); setSelectedSlot(null); return; }
      setSaving(true);
      try {
        await moveCard(binder.id, currentPage.id, selectedSlot, { fromPageId: currentPage.id, fromSlotIndex: selectedSlot, toPageId: currentPage.id, toSlotIndex: slotIndex });
        await refreshBinder();
      } finally { setSaving(false); setMode('normal'); setSelectedSlot(null); }
      return;
    }

    if (mode === 'copy' && selectedSlot !== null) {
      if (slotIndex === selectedSlot) { setMode('normal'); setSelectedSlot(null); return; }
      setSaving(true);
      try {
        await copyCard(binder.id, currentPage.id, selectedSlot, { toPageId: currentPage.id, toSlotIndex: slotIndex });
        await refreshBinder();
      } finally { setSaving(false); setMode('normal'); setSelectedSlot(null); }
      return;
    }

    // Normal mode — select / deselect
    if (selectedSlot === slotIndex) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slotIndex);
    }
  }, [binder.id, currentPage, mode, selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEdit() {
    if (selectedSlot === null || !currentPage) return;
    setPendingSlot(selectedSlot);
    setShowAddModal(true);
    setSelectedSlot(null);
  }

  async function handleClear() {
    if (selectedSlot === null || !currentPage) return;
    setSaving(true);
    try {
      await clearSlot(binder.id, currentPage.id, selectedSlot);
      await refreshBinder();
    } finally { setSaving(false); setSelectedSlot(null); }
  }

  function handleMove() {
    if (selectedSlot === null) return;
    setMode('move');
  }

  function handleCopy() {
    if (selectedSlot === null) return;
    setMode('copy');
  }

  function handleDismissToolbar() {
    setSelectedSlot(null);
    setMode('normal');
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
      setPageIndex(binder.pages.length); // go to newly created page
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

  const hasSelectedCard = selectedSlot !== null && !!getSlot(selectedSlot)?.cardId;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => router.push('/binders')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>{binder.name}</span>
        </button>
      </div>

      {mode !== 'normal' && (
        <div className={styles.modeBanner}>
          <span>{mode === 'move' ? 'Move mode — click destination slot' : 'Copy mode — click destination slot'}</span>
          <button type="button" className={styles.modeCancel} onClick={() => { setMode('normal'); setSelectedSlot(null); }}>Cancel</button>
        </div>
      )}

      {currentPage ? (
        <BinderGrid
          page={currentPage}
          gridCols={binder.gridCols}
          gridRows={binder.gridRows}
          onSlotClick={handleSlotClick}
          selectedSlot={selectedSlot}
        />
      ) : (
        <div className={styles.emptyPage}>
          <p>No pages yet</p>
          <button type="button" className={styles.addPageBtn} onClick={handleAddPage} disabled={saving}>
            Add first page
          </button>
        </div>
      )}

      {selectedSlot !== null && mode === 'normal' && (
        <div className={styles.toolbarWrap}>
          <SlotActionToolbar
            hasCard={hasSelectedCard}
            onEdit={handleEdit}
            onClear={handleClear}
            onMove={handleMove}
            onCopy={handleCopy}
            onDismiss={handleDismissToolbar}
          />
        </div>
      )}

      <div className={styles.pageNav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          disabled={pageIndex === 0}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setShowEditModal(true)}
          aria-label="Binder settings"
          title="Binder settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        <button
          type="button"
          className={styles.navBtnSecondary}
          onClick={handleAddPage}
          disabled={saving}
          aria-label="Add page"
          title="Add page"
        >
          + Page
        </button>
      </div>

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
