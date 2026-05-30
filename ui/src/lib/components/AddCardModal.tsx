'use client';

import { useState, useEffect, useRef } from 'react';
import type { CardSnapshot } from '$shared/binders';
import type { TcgCard } from '$shared/tcg';
import type { CollectionEntry } from '$shared/collection';
import styles from './AddCardModal.module.css';

interface Props {
  onSelect: (snapshot: CardSnapshot) => void;
  onClose: () => void;
}

type Tab = 'collection' | 'cards';

function cardToSnapshot(card: TcgCard): CardSnapshot {
  return {
    name: card.name,
    imageSmall: card.images?.small ?? '',
    setName: typeof card.set === 'string' ? card.set : (card.set as unknown as { name: string })?.name ?? '',
    setId: typeof card.set === 'string' ? card.set.toLowerCase().replace(/\s+/g, '-') : (card.set as unknown as { id: string })?.id ?? '',
    setCode: (card as unknown as { setCode?: string }).setCode ?? '',
    rarity: card.rarity ?? null,
  };
}

export function AddCardModal({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('collection');
  // Collection tab state
  const [collection, setCollection] = useState<CollectionEntry[]>([]);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [loadingCollection, setLoadingCollection] = useState(false);
  // Cards tab state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cardResults, setCardResults] = useState<TcgCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const collectionLoadedRef = useRef(false);

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      triggerRef.current?.focus();
    };
  }, [onClose]);

  // Load collection on first open
  useEffect(() => {
    if (tab !== 'collection' || collectionLoadedRef.current) return;
    collectionLoadedRef.current = true;
    let cancelled = false;
    async function fetchCollection() {
      setLoadingCollection(true);
      try {
        const res = await fetch('/api/collection', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const body = await res.json() as { entries: CollectionEntry[] };
        if (!cancelled) setCollection(Array.isArray(body.entries) ? body.entries : []);
      } finally {
        if (!cancelled) setLoadingCollection(false);
      }
    }
    void fetchCollection();
    return () => { cancelled = true; };
  }, [tab]);

  // Debounced card search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) return;
    debounceRef.current = setTimeout(async () => {
      setLoadingCards(true);
      try {
        const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}&lang=en`);
        if (!res.ok) return;
        const body = await res.json() as { cards: TcgCard[] };
        const cards = Array.isArray(body.cards) ? body.cards : [];
        const nameSet = new Set<string>();
        cards.forEach((c) => { if (c.name) nameSet.add(c.name); });
        setSuggestions(Array.from(nameSet).slice(0, 8));
        setCardResults(cards);
      } finally {
        setLoadingCards(false);
      }
    }, 300);
  }, [query]);

  function handleCardSelect(card: TcgCard) {
    const snap = cardToSnapshot(card);
    onSelect(snap);
    onClose();
  }

  function handleCollectionSelect(entry: CollectionEntry) {
    const snap = cardToSnapshot(entry.card);
    onSelect(snap);
    onClose();
  }

  const filteredCollection = collection.filter((e) =>
    collectionFilter.trim() === '' || e.card.name.toLowerCase().includes(collectionFilter.toLowerCase())
  );

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Add card"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add card</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close add card modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'collection'}
            className={`${styles.tab} ${tab === 'collection' ? styles.tabActive : ''}`}
            onClick={() => setTab('collection')}
          >
            Collection
          </button>
          <button
            role="tab"
            aria-selected={tab === 'cards'}
            className={`${styles.tab} ${tab === 'cards' ? styles.tabActive : ''}`}
            onClick={() => setTab('cards')}
          >
            Cards
          </button>
        </div>

        {tab === 'collection' && (
          <div className={styles.tabPanel}>
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder="Filter your collection…"
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              aria-label="Filter collection"
              autoComplete="off"
            />
            {loadingCollection && <p className={styles.loading}>Loading collection…</p>}
            {!loadingCollection && collection.length === 0 && (
              <p className={styles.empty}>Your collection is empty. Search for cards in the Cards tab.</p>
            )}
            {!loadingCollection && collection.length > 0 && filteredCollection.length === 0 && (
              <p className={styles.empty}>No cards match your filter.</p>
            )}
            <div className={styles.grid3}>
              {filteredCollection.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={styles.cardTile}
                  onClick={() => handleCollectionSelect(entry)}
                  title={`Add ${entry.card.name}`}
                >
                  {entry.card.images?.small && (
                    <img src={entry.card.images.small} alt={entry.card.name} className={styles.cardImg} />
                  )}
                  {entry.quantity > 1 && (
                    <span className={styles.quantityBadge}>×{entry.quantity}</span>
                  )}
                  <span className={styles.tileAddIcon} aria-hidden="true">+</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'cards' && (
          <div className={styles.tabPanel}>
            <div className={styles.searchWrap}>
              <input
                ref={tab === 'cards' ? inputRef : undefined}
                className={styles.searchInput}
                placeholder="Search for a card…"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (val.length < 2) { setSuggestions([]); setCardResults([]); }
                }}
                aria-label="Search for a card"
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className={styles.suggestions} role="listbox">
                  {suggestions.map((s) => (
                    <li
                      key={s}
                      role="option"
                      aria-selected={false}
                      className={styles.suggestion}
                      onClick={() => { setQuery(s); setSuggestions([]); }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {loadingCards && <p className={styles.loading}>Searching…</p>}
            {!loadingCards && cardResults.length === 0 && query.length >= 2 && (
              <p className={styles.empty}>No cards found</p>
            )}
            <div className={styles.grid3}>
              {cardResults.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={styles.cardTile}
                  onClick={() => handleCardSelect(card)}
                  title={`Add ${card.name}`}
                >
                  {card.images?.small && (
                    <img src={card.images.small} alt={card.name} className={styles.cardImg} />
                  )}
                  <span className={styles.setCode}>{(card as unknown as { setCode?: string }).setCode ?? ''}</span>
                  <span className={styles.tileAddIcon} aria-hidden="true">+</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
