'use client';

import { useState, useRef } from 'react';
import type { BinderPage, BinderSlot } from '$shared/binders';
import styles from './BinderGrid.module.css';

interface Props {
  page: BinderPage;
  gridCols: number;
  gridRows: number;
  onSlotClick: (slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
  onDragDrop: (fromSlotIndex: number, toSlotIndex: number) => void;
  onUploadCustomImage: (slotIndex: number, file: File) => void;
  onClearCustomImage: (slotIndex: number) => void;
  /** Slot highlighted as move/copy destination */
  selectedSlot?: number | null;
}

export function BinderGrid({ page, gridCols, gridRows, onSlotClick, onClearSlot, onDragDrop, onUploadCustomImage, onClearCustomImage, selectedSlot }: Props) {
  const total = gridCols * gridRows;
  const slotMap = new Map<number, BinderSlot>();
  page.slots.forEach((s) => slotMap.set(s.slotIndex, s));

  const [dragFromSlot, setDragFromSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetSlot = useRef<number | null>(null);

  function handleUploadClick(e: React.MouseEvent, slotIndex: number) {
    e.stopPropagation();
    uploadTargetSlot.current = slotIndex;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && uploadTargetSlot.current !== null) {
      onUploadCustomImage(uploadTargetSlot.current, file);
    }
    // Reset so the same file can be re-selected
    e.target.value = '';
    uploadTargetSlot.current = null;
  }

  // Scale gap and icon down proportionally for larger grids
  const maxDim = Math.max(gridCols, gridRows);
  const gap = maxDim <= 4 ? '0.5rem' : maxDim <= 6 ? '0.35rem' : maxDim <= 8 ? '0.25rem' : '0.15rem';
  const iconSize = maxDim <= 4 ? 28 : maxDim <= 6 ? 22 : maxDim <= 8 ? 16 : 12;

  function handleDragStart(e: React.DragEvent, slotIndex: number) {
    setDragFromSlot(slotIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(slotIndex));
  }

  function handleDragOver(e: React.DragEvent, slotIndex: number) {
    if (dragFromSlot === null || dragFromSlot === slotIndex) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slotIndex);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverSlot(null);
    }
  }

  function handleDrop(e: React.DragEvent, slotIndex: number) {
    e.preventDefault();
    if (dragFromSlot !== null && dragFromSlot !== slotIndex) {
      onDragDrop(dragFromSlot, slotIndex);
    }
    setDragFromSlot(null);
    setDragOverSlot(null);
  }

  function handleDragEnd() {
    setDragFromSlot(null);
    setDragOverSlot(null);
  }

  return (
    <>
      {/* Hidden file input for custom image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className={styles.hiddenFileInput}
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap }}
      >
        {Array.from({ length: total }, (_, i) => {
          const slot = slotMap.get(i);
          const occupied = !!slot?.cardId;
          const hasCustomImage = !!slot?.customImageUrl;
          const displayImage = slot?.customImageUrl ?? slot?.cardSnapshot?.imageSmall;
          const isSelected = selectedSlot === i;
          const isDragOver = dragOverSlot === i;
          const isDragging = dragFromSlot === i;

          return (
            <button
              key={i}
              type="button"
              data-testid="binder-slot"
              draggable={occupied}
              className={[
                styles.slot,
                occupied ? styles.occupied : styles.empty,
                hasCustomImage ? styles.customImage : '',
                isSelected ? styles.selected : '',
                isDragOver ? styles.dragOver : '',
                isDragging ? styles.dragging : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSlotClick(i)}
              onDragStart={occupied ? (e) => handleDragStart(e, i) : undefined}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              aria-label={occupied ? `Card: ${slot!.cardSnapshot?.name ?? 'Unknown'}, slot ${i + 1}` : `Add card to slot ${i + 1}`}
            >
              {occupied && slot!.cardSnapshot ? (
                <>
                  <img
                    src={displayImage}
                    alt={slot!.cardSnapshot.name}
                    className={styles.cardImg}
                    draggable={false}
                  />
                  {!hasCustomImage && slot!.cardSnapshot.rarity && (
                    <span className={styles.rarityBadge} title={slot!.cardSnapshot.rarity}>
                      {slot!.cardSnapshot.rarity.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                  {!hasCustomImage && (
                    <span className={styles.setCode}>{slot!.cardSnapshot.setCode}</span>
                  )}
                  <div className={styles.cardActions}>
                    {/* Upload custom image */}
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={(e) => handleUploadClick(e, i)}
                      aria-label={`Upload custom image for ${slot!.cardSnapshot.name}`}
                      title={hasCustomImage ? 'Replace custom image' : 'Upload custom image'}
                      draggable={false}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </button>
                    {/* Remove custom image */}
                    {hasCustomImage && (
                      <button
                        type="button"
                        className={styles.clearCustomBtn}
                        onClick={(e) => { e.stopPropagation(); onClearCustomImage(i); }}
                        aria-label={`Remove custom image for ${slot!.cardSnapshot.name}`}
                        title="Remove custom image"
                        draggable={false}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" aria-hidden="true">
                          <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    )}
                    {/* Remove card */}
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); onClearSlot(i); }}
                      aria-label={`Remove ${slot!.cardSnapshot.name}`}
                      title="Remove card"
                      draggable={false}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width={iconSize}
                  height={iconSize}
                  className={styles.addIcon}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
