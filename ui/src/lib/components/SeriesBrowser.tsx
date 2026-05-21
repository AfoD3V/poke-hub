'use client';

import { useState, useCallback } from 'react';
import type { SeriesItem, SeriesDetail, SetCardItem, TcgCard } from '$shared/tcg';
import { Card } from './Card';
import { CardModal } from './CardModal';
import styles from './SeriesBrowser.module.css';

export interface SeriesBrowserProps {
  series?: SeriesItem[];
  onSelect?: (card: TcgCard) => void;
  chaseIds?: Set<string>;
  collectionIds?: Set<string>;
}

const PAGE_SIZE = 40;

function toTcgCard(item: SetCardItem, setName: string): TcgCard {
  return {
    id: item.id,
    name: item.name,
    supertype: 'Pokemon',
    set: setName,
    number: item.localId,
    images: {
      small: item.image ? `${item.image}/low.webp`  : '',
      large: item.image ? `${item.image}/high.webp` : '',
    },
  };
}

export function SeriesBrowser({ series = [], onSelect, chaseIds, collectionIds }: SeriesBrowserProps) {
  const [activeColumn, setActiveColumn]       = useState(0);
  const [selectedSeries, setSelectedSeries]   = useState<SeriesItem | null>(null);
  const [selectedSet, setSelectedSet]         = useState<{ id: string; name: string } | null>(null);
  const [seriesDetail, setSeriesDetail]       = useState<SeriesDetail | null>(null);
  const [setCards, setSetCards]               = useState<SetCardItem[]>([]);
  const [loadingCol2, setLoadingCol2]         = useState(false);
  const [loadingCol3, setLoadingCol3]         = useState(false);
  const [errorCol2, setErrorCol2]             = useState<string | null>(null);
  const [errorCol3, setErrorCol3]             = useState<string | null>(null);
  const [expandedCard, setExpandedCard]       = useState<TcgCard | null>(null);
  const [visibleCount, setVisibleCount]       = useState(PAGE_SIZE);
  const [failedSeriesLogos, setFailedSeriesLogos] = useState<Set<string>>(new Set());
  const [failedSetLogos, setFailedSetLogos]       = useState<Set<string>>(new Set());

  const visibleCards = setCards.slice(0, visibleCount);
  const hasMore = visibleCount < setCards.length;

  // Col 1 (series): always compact sidebar
  const col1Style: React.CSSProperties = { width: '220px', flexShrink: 0 };

  // Col 2 (sets): appears when a series is selected
  const col2Style: React.CSSProperties = activeColumn >= 1
    ? { width: '220px', flexShrink: 0 }
    : { width: 0, minWidth: 0, overflow: 'hidden' };

  // Col 3 (cards): fills all remaining space when a set is selected
  const col3Style: React.CSSProperties = activeColumn >= 2
    ? { flex: 1, minWidth: 0 }
    : { flex: 'none', width: 0, minWidth: 0, overflow: 'hidden' };

  const selectSeries = useCallback(async (s: SeriesItem) => {
    setSelectedSeries(s);
    setSelectedSet(null);
    setSeriesDetail(null);
    setSetCards([]);
    setVisibleCount(PAGE_SIZE);
    setActiveColumn(1);
    setLoadingCol2(true);
    setErrorCol2(null);
    try {
      const res  = await fetch(`/api/series/${encodeURIComponent(s.id)}`);
      const body = await res.json() as SeriesDetail & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `Failed to load series (${res.status})`);
      setSeriesDetail(body);
    } catch (e) {
      setErrorCol2(e instanceof Error ? e.message : 'Failed to load series');
    } finally {
      setLoadingCol2(false);
    }
  }, []);

  const selectSet = useCallback(async (set: { id: string; name: string }) => {
    setSelectedSet(set);
    setSetCards([]);
    setVisibleCount(PAGE_SIZE);
    setActiveColumn(2);
    setLoadingCol3(true);
    setErrorCol3(null);
    try {
      const res = await fetch(`/api/sets/${encodeURIComponent(set.id)}/cards`);
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `Failed to load set (${res.status})`);
      }
      const cards = await res.json() as SetCardItem[];
      setSetCards(cards);
    } catch (e) {
      setErrorCol3(e instanceof Error ? e.message : 'Failed to load set');
    } finally {
      setLoadingCol3(false);
    }
  }, []);

  return (
    <>
      <div className={styles['series-browser']}>
        {/* Column 1: Series list */}
        <div className={styles['series-browser__col']} style={col1Style}>
          <div className={styles['series-browser__col-inner']}>
            <div className={styles['series-grid']}>
              {series.map((s) => (
                <button
                  key={s.id}
                  className={`${styles['series-tile']} ${selectedSeries?.id === s.id ? styles['series-tile--active'] : ''}`}
                  onClick={() => selectSeries(s)}
                >
                  {s.logo && !failedSeriesLogos.has(s.id) ? (
                    <img
                      src={s.logo}
                      alt={s.name}
                      className={styles['series-tile__logo']}
                      onError={() => setFailedSeriesLogos(prev => new Set(prev).add(s.id))}
                    />
                  ) : (
                    <span className={styles['series-tile__name']}>{s.name}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Sets list */}
        <div className={styles['series-browser__col']} style={col2Style}>
          <div className={styles['series-browser__col-inner']}>
            {loadingCol2 && <p className={styles['series-browser__status']}>Loading…</p>}
            {errorCol2   && <p className={styles['series-browser__error']}>{errorCol2}</p>}
            {seriesDetail?.sets && (
              <div className={styles['set-grid']}>
                {seriesDetail.sets.map((set) => (
                  <button
                    key={set.id}
                    className={`${styles['set-tile']} ${selectedSet?.id === set.id ? styles['set-tile--active'] : ''}`}
                    onClick={() => selectSet({ id: set.id, name: set.name })}
                  >
                    {set.logo && !failedSetLogos.has(set.id) ? (
                      <img
                        src={set.logo}
                        alt={set.name}
                        className={styles['set-tile__logo']}
                        onError={() => setFailedSetLogos(prev => new Set(prev).add(set.id))}
                      />
                    ) : (
                      <div className={styles['set-tile__fallback']}>{set.name[0]}</div>
                    )}
                    <span className={styles['set-tile__name']}>{set.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Cards grid */}
        <div className={styles['series-browser__col']} style={col3Style}>
          <div className={styles['series-browser__col-inner']}>
            {loadingCol3 && <p className={styles['series-browser__status']}>Loading…</p>}
            {errorCol3   && <p className={styles['series-browser__error']}>{errorCol3}</p>}
            <ul className={styles['card-grid']} role="list">
              {visibleCards.map((item) => {
                const tcgCard = toTcgCard(item, selectedSet?.name ?? '');
                return (
                  <Card
                    key={item.id}
                    card={tcgCard}
                    onExpand={(c) => { setExpandedCard(c); onSelect?.(c); }}
                    isChased={chaseIds?.has(item.id) ?? false}
                    isCollected={collectionIds?.has(item.id) ?? false}
                  />
                );
              })}
            </ul>
            {hasMore && (
              <button
                className={styles['series-browser__load-more']}
                onClick={() => setVisibleCount(n => n + PAGE_SIZE)}
              >
                Load more
              </button>
            )}
          </div>
        </div>
      </div>

      {expandedCard && (
        <CardModal card={expandedCard} onClose={() => setExpandedCard(null)} />
      )}
    </>
  );
}
