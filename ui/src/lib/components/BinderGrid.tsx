'use client';

import type { BinderPage, BinderSlot } from '$shared/binders';
import styles from './BinderGrid.module.css';

interface Props {
  page: BinderPage;
  gridCols: number;
  gridRows: number;
  onSlotClick: (slotIndex: number) => void;
  selectedSlot?: number | null;
}

export function BinderGrid({ page, gridCols, gridRows, onSlotClick, selectedSlot }: Props) {
  const total = gridCols * gridRows;
  const slotMap = new Map<number, BinderSlot>();
  page.slots.forEach((s) => slotMap.set(s.slotIndex, s));

  // Scale gap and icon down proportionally for larger grids
  const maxDim = Math.max(gridCols, gridRows);
  const gap = maxDim <= 4 ? '0.5rem' : maxDim <= 6 ? '0.35rem' : maxDim <= 8 ? '0.25rem' : '0.15rem';
  const iconSize = maxDim <= 4 ? 28 : maxDim <= 6 ? 22 : maxDim <= 8 ? 16 : 12;

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap }}
    >
      {Array.from({ length: total }, (_, i) => {
        const slot = slotMap.get(i);
        const occupied = !!slot?.cardId;
        const isSelected = selectedSlot === i;

        return (
          <button
            key={i}
            type="button"
            data-testid="binder-slot"
            className={`${styles.slot} ${occupied ? styles.occupied : styles.empty} ${isSelected ? styles.selected : ''}`}
            onClick={() => onSlotClick(i)}
            aria-label={occupied ? `Card: ${slot!.cardSnapshot?.name ?? 'Unknown'}, slot ${i + 1}` : `Add card to slot ${i + 1}`}
          >
            {occupied && slot!.cardSnapshot ? (
              <>
                <img
                  src={slot!.cardSnapshot.imageSmall}
                  alt={slot!.cardSnapshot.name}
                  className={styles.cardImg}
                />
                {slot!.cardSnapshot.rarity && (
                  <span className={styles.rarityBadge} title={slot!.cardSnapshot.rarity}>
                    {slot!.cardSnapshot.rarity.substring(0, 2).toUpperCase()}
                  </span>
                )}
                <span className={styles.setCode}>{slot!.cardSnapshot.setCode}</span>
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
