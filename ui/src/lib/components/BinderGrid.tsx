'use client';

import { useState } from 'react';
import type { BinderPage, BinderSlot } from '$shared/binders';
import styles from './BinderGrid.module.css';

interface Props {
  page: BinderPage;
  gridCols: number;
  gridRows: number;
  onSlotClick: (slotIndex: number) => void;
  onClearSlot: (slotIndex: number) => void;
  onDragDrop: (fromSlotIndex: number, toSlotIndex: number) => void;
  /** Slot highlighted as move/copy destination */
  selectedSlot?: number | null;
}

export function BinderGrid({ page, gridCols, gridRows, onSlotClick, onClearSlot, onDragDrop, selectedSlot }: Props) {
  const total = gridCols * gridRows;
  const slotMap = new Map<number, BinderSlot>();
  page.slots.forEach((s) => slotMap.set(s.slotIndex, s));

  const [dragFromSlot, setDragFromSlot] = useState<number | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

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
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap }}
    >
      {Array.from({ length: total }, (_, i) => {
        const slot = slotMap.get(i);
        const occupied = !!slot?.cardId;
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
                  src={slot!.cardSnapshot.imageSmall}
                  alt={slot!.cardSnapshot.name}
                  className={styles.cardImg}
                  draggable={false}
                />
                {slot!.cardSnapshot.rarity && (
                  <span className={styles.rarityBadge} title={slot!.cardSnapshot.rarity}>
                    {slot!.cardSnapshot.rarity.substring(0, 2).toUpperCase()}
                  </span>
                )}
                <span className={styles.setCode}>{slot!.cardSnapshot.setCode}</span>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={(e) => { e.stopPropagation(); onClearSlot(i); }}
                    aria-label={`Remove ${slot!.cardSnapshot.name}`}
                    title="Remove card"
                    draggable={false}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" aria-hidden="true">
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
  );
}
