'use client';

import { useState, useEffect, useRef } from 'react';
import type { CardSnapshot } from '$shared/binders';
import type { TcgCard } from '$shared/tcg';
import styles from './AddCardModal.module.css';

interface TcgSet {
  id: string;
  name: string;
  code?: string;
  logo?: string;
  symbol?: string;
}

interface SetCardItem {
  id: string;
  name: string;
  image?: string;
  rarity?: string;
  localId?: string;
}

interface Props {
  onSelect: (snapshot: CardSnapshot) => void;
  onClose: () => void;
}

type Tab = 'cards' | 'sets';

function cardToSnapshot(card: TcgCard | SetCardItem, setInfo?: { name: string; id: string; code: string }): CardSnapshot {
  if ('images' in card) {
    const c = card as TcgCard;
    return {
      name: c.name,
      imageSmall: c.images?.small ?? '',
      setName: typeof c.set === 'string' ? c.set : (c.set as unknown as { name: string })?.name ?? '',
      setId: typeof c.set === 'string' ? c.set.toLowerCase().replace(/\s+/g, '-') : (c.set as unknown as { id: string })?.id ?? '',
      setCode: (c as unknown as { setCode?: string }).setCode ?? '',
      rarity: c.rarity ?? null,
    };
  }
  const c = card as SetCardItem;
  return {
    name: c.name,
    imageSmall: c.image ? `${c.image}/low.webp` : '',
    setName: setInfo?.name ?? '',
    setId: setInfo?.id ?? '',
    setCode: setInfo?.code ?? '',
    rarity: c.rarity ?? null,
  };
}

export function AddCardModal({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('cards');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cardResults, setCardResults] = useState<TcgCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [sets, setSets] = useState<TcgSet[]>([]);
  const [setsFilter, setSetsFilter] = useState('');
  const [selectedSet, setSelectedSet] = useState<TcgSet | null>(null);
  const [setCards, setSetCards] = useState<SetCardItem[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [loadingSetCards, setLoadingSetCards] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Capture the element that triggered this modal so we can restore focus
    triggerRef.current = document.activeElement as HTMLElement;
    inputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      triggerRef.current?.focus();
    };
  }, [onClose]);

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
        // Build unique name suggestions
        const nameSet = new Set<string>();
        cards.forEach((c) => { if (c.name) nameSet.add(c.name); });
        setSuggestions(Array.from(nameSet).slice(0, 8));
        setCardResults(cards);
      } finally {
        setLoadingCards(false);
      }
    }, 300);
  }, [query]);

  // Load sets when sets tab is first opened
  const setsLoadedRef = useRef(false);
  useEffect(() => {
    if (tab !== 'sets' || setsLoadedRef.current) return;
    setsLoadedRef.current = true;
    let cancelled = false;
    async function fetchSets() {
      setLoadingSets(true);
      try {
        const res = await fetch('/api/series');
        if (!res.ok || cancelled) return;
        const body = await res.json() as { series: Array<{ sets: TcgSet[] }> };
        const allSets: TcgSet[] = [];
        if (Array.isArray(body.series)) {
          body.series.forEach((s) => { if (Array.isArray(s.sets)) allSets.push(...s.sets); });
        }
        if (!cancelled) setSets(allSets);
      } finally {
        if (!cancelled) setLoadingSets(false);
      }
    }
    void fetchSets();
    return () => { cancelled = true; };
  }, [tab]);

  async function handleSetSelect(set: TcgSet) {
    setSelectedSet(set);
    setLoadingSetCards(true);
    try {
      const res = await fetch(`/api/sets/${set.id}/cards`);
      if (!res.ok) return;
      const cards = await res.json() as SetCardItem[];
      setSetCards(Array.isArray(cards) ? cards : []);
    } finally {
      setLoadingSetCards(false);
    }
  }

  function handleCardSelect(card: TcgCard | SetCardItem) {
    const snap = cardToSnapshot(card, selectedSet ? { name: selectedSet.name, id: selectedSet.id, code: selectedSet.code ?? '' } : undefined);
    onSelect(snap);
    onClose();
  }

  const filteredSets = sets.filter((s) =>
    setsFilter.trim() === '' || s.name.toLowerCase().includes(setsFilter.toLowerCase())
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
            aria-selected={tab === 'cards'}
            className={`${styles.tab} ${tab === 'cards' ? styles.tabActive : ''}`}
            onClick={() => setTab('cards')}
          >
            Cards
          </button>
          <button
            role="tab"
            aria-selected={tab === 'sets'}
            className={`${styles.tab} ${tab === 'sets' ? styles.tabActive : ''}`}
            onClick={() => setTab('sets')}
          >
            Sets
          </button>
        </div>

        {tab === 'cards' && (
          <div className={styles.tabPanel}>
            <div className={styles.searchWrap}>
              <input
                ref={inputRef}
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

        {tab === 'sets' && (
          <div className={styles.tabPanel}>
            {!selectedSet ? (
              <>
                <input
                  className={styles.searchInput}
                  placeholder="Search for a series…"
                  value={setsFilter}
                  onChange={(e) => setSetsFilter(e.target.value)}
                  aria-label="Search for a set"
                />
                {loadingSets && <p className={styles.loading}>Loading sets…</p>}
                <ul className={styles.setList}>
                  {filteredSets.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={styles.setItem}
                        onClick={() => handleSetSelect(s)}
                      >
                        {s.logo && <img src={s.logo} alt="" className={styles.setLogo} aria-hidden="true" />}
                        {s.code && <span className={styles.setCode}>{s.code}</span>}
                        <span className={styles.setName}>{s.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => { setSelectedSet(null); setSetCards([]); }}
                >
                  ← Back to sets
                </button>
                <p className={styles.setHeading}>{selectedSet.name}</p>
                {loadingSetCards && <p className={styles.loading}>Loading cards…</p>}
                <div className={styles.grid3}>
                  {setCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className={styles.cardTile}
                      onClick={() => handleCardSelect(card)}
                      title={`Add ${card.name}`}
                    >
                      {card.image && (
                        <img src={`${card.image}/low.webp`} alt={card.name} className={styles.cardImg} />
                      )}
                      <span className={styles.setCode}>{selectedSet.code ?? ''}</span>
                      <span className={styles.tileAddIcon} aria-hidden="true">+</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
