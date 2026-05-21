'use client';

import { useState, useCallback } from 'react';
import type { CollectionEntry } from '$shared/collection';
import type { TcgCard } from '$shared/tcg';
import { Card } from '@/lib/components/Card';
import { CardModal } from '@/lib/components/CardModal';
import styles from './CollectionView.module.css';

export interface CollectionViewProps {
  entries: CollectionEntry[];
  chaseIds: string[];
  error?: string;
}

export function CollectionView({ entries, chaseIds: initialChaseIds, error }: CollectionViewProps) {
  const [expandedCard, setExpandedCard] = useState<TcgCard | null>(null);
  const [chaseIds] = useState(new Set(initialChaseIds));
  const [collectionEntries, setCollectionEntries] = useState(entries);

  const collectionIds = new Set(collectionEntries.map((e) => e.cardId));

  const handleCollectionRemove = useCallback((cardId: string) => {
    setCollectionEntries((prev) => prev.filter((e) => e.cardId !== cardId));
  }, []);

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles['page-title']}>My Collection</h1>
        <div className={styles['page-error']}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles['page-header']}>
        <h1 className={styles['page-title']}>My Collection</h1>
        <p className={styles['page-count']}>{collectionEntries.length} card{collectionEntries.length === 1 ? '' : 's'}</p>
      </div>

      {collectionEntries.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles['empty-text']}>Your collection is empty.</p>
          <a href="/search" className={styles['empty-link']}>Search for cards to add →</a>
        </div>
      ) : (
        <ul className={styles['card-grid']} role="list">
          {collectionEntries.map((entry) => (
            <Card
              key={entry.id}
              card={entry.card}
              onExpand={setExpandedCard}
            />
          ))}
        </ul>
      )}

      {expandedCard && (
        <CardModal
          card={expandedCard}
          chaseIds={chaseIds}
          collectionIds={collectionIds}
          onClose={() => setExpandedCard(null)}
          onCollectionRemove={handleCollectionRemove}
        />
      )}
    </div>
  );
}
