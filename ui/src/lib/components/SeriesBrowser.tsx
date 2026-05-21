'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SeriesItem, SeriesDetail, SetCardItem, TcgCard } from '$shared/tcg';
import { Card } from './Card';
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
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [selectedSet,    setSelectedSet   ] = useState<{ id: string; name: string } | null>(null);
  const [seriesDetail,   setSeriesDetail  ] = useState<SeriesDetail | null>(null);
  const [setCards,       setSetCards      ] = useState<SetCardItem[]>([]);
  const [loadingSeries,  setLoadingSeries ] = useState(false);
  const [loadingSet,     setLoadingSet    ] = useState(false);
  const [errorSeries,    setErrorSeries   ] = useState<string | null>(null);
  const [errorSet,       setErrorSet      ] = useState<string | null>(null);
  const [visibleCount,   setVisibleCount  ] = useState(PAGE_SIZE);
  const [filterText,     setFilterText    ] = useState('');
  const [failedLogos,    setFailedLogos   ] = useState<Set<string>>(new Set());

  const viewState: 'root' | 'series' | 'set' =
    selectedSet ? 'set' : selectedSeries ? 'series' : 'root';

  const filterPlaceholder =
    viewState === 'set'    ? `Filter ${setCards.length} cards…` :
    viewState === 'series' ? 'Filter sets…' :
    'Filter series…';

  const filteredSeries = useMemo(
    () => filterText
      ? series.filter(s => s.name.toLowerCase().includes(filterText.toLowerCase()))
      : series,
    [series, filterText],
  );

  const filteredSets = useMemo(
    () => filterText && seriesDetail?.sets
      ? seriesDetail.sets.filter(s => s.name.toLowerCase().includes(filterText.toLowerCase()))
      : (seriesDetail?.sets ?? []),
    [seriesDetail, filterText],
  );

  const filteredCards = useMemo(() => {
    if (filterText) return setCards.filter(c => c.name.toLowerCase().includes(filterText.toLowerCase()));
    return setCards.slice(0, visibleCount);
  }, [setCards, visibleCount, filterText]);

  const hasMore = !filterText && visibleCount < setCards.length;

  const selectSeries = useCallback(async (s: SeriesItem) => {
    setSelectedSeries(s);
    setSelectedSet(null);
    setSeriesDetail(null);
    setSetCards([]);
    setVisibleCount(PAGE_SIZE);
    setFilterText('');
    setLoadingSeries(true);
    setErrorSeries(null);
    try {
      const res  = await fetch(`/api/series/${encodeURIComponent(s.id)}`);
      const body = await res.json() as SeriesDetail & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `Failed to load series (${res.status})`);
      setSeriesDetail(body);
    } catch (e) {
      setErrorSeries(e instanceof Error ? e.message : 'Failed to load series');
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  const selectSet = useCallback(async (set: { id: string; name: string }) => {
    setSelectedSet(set);
    setSetCards([]);
    setVisibleCount(PAGE_SIZE);
    setFilterText('');
    setLoadingSet(true);
    setErrorSet(null);
    try {
      const res = await fetch(`/api/sets/${encodeURIComponent(set.id)}/cards`);
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `Failed to load set (${res.status})`);
      }
      const cards = await res.json() as SetCardItem[];
      setSetCards(cards);
    } catch (e) {
      setErrorSet(e instanceof Error ? e.message : 'Failed to load set');
    } finally {
      setLoadingSet(false);
    }
  }, []);

  const goToRoot = useCallback(() => {
    setSelectedSeries(null);
    setSelectedSet(null);
    setSeriesDetail(null);
    setSetCards([]);
    setFilterText('');
  }, []);

  const goToSeries = useCallback(() => {
    setSelectedSet(null);
    setSetCards([]);
    setFilterText('');
  }, []);

  const markLogoFailed = useCallback((id: string) => {
    setFailedLogos(prev => new Set(prev).add(id));
  }, []);

  return (
    <div className={styles.browser}>

      {/* ── Series navigation sidebar ──────────────────────────────────── */}
      <nav className={styles['series-nav']} aria-label="Series">
        <div className={styles['series-nav__label']}>Series</div>

        <button
          className={`${styles['series-nav__item']} ${viewState === 'root' ? styles['series-nav__item--active'] : ''}`}
          onClick={goToRoot}
          aria-current={viewState === 'root' ? 'page' : undefined}
        >
          <span className={styles['series-nav__grid-icon']} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1.2"/>
              <rect x="9" y="1" width="6" height="6" rx="1.2"/>
              <rect x="1" y="9" width="6" height="6" rx="1.2"/>
              <rect x="9" y="9" width="6" height="6" rx="1.2"/>
            </svg>
          </span>
          <span className={styles['series-nav__name']}>All Series</span>
        </button>

        {series.map((s) => (
          <button
            key={s.id}
            className={`${styles['series-nav__item']} ${selectedSeries?.id === s.id ? styles['series-nav__item--active'] : ''}`}
            onClick={() => selectSeries(s)}
            aria-current={selectedSeries?.id === s.id ? 'page' : undefined}
          >
            {s.logo && !failedLogos.has(s.id) ? (
              <img
                src={s.logo}
                alt=""
                className={styles['series-nav__logo']}
                onError={() => markLogoFailed(s.id)}
              />
            ) : (
              <span className={styles['series-nav__logo-fallback']}>{s.name[0]}</span>
            )}
            <span className={styles['series-nav__name']}>{s.name}</span>
          </button>
        ))}
      </nav>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className={styles['browser-main']}>

        {/* Toolbar: breadcrumbs + filter */}
        <div className={styles['browser-toolbar']}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <button className={styles['breadcrumb-btn']} onClick={goToRoot}>Browse</button>
            {selectedSeries && (
              <>
                <span className={styles['breadcrumb-sep']} aria-hidden="true">›</span>
                {selectedSet ? (
                  <button className={styles['breadcrumb-btn']} onClick={goToSeries}>
                    {selectedSeries.name}
                  </button>
                ) : (
                  <span className={styles['breadcrumb-current']}>{selectedSeries.name}</span>
                )}
              </>
            )}
            {selectedSet && (
              <>
                <span className={styles['breadcrumb-sep']} aria-hidden="true">›</span>
                <span className={styles['breadcrumb-current']}>{selectedSet.name}</span>
              </>
            )}
          </nav>

          <div className={styles['filter-wrap']}>
            <svg className={styles['filter-icon']} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className={styles['filter-input']}
              type="search"
              placeholder={filterPlaceholder}
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              aria-label="Filter"
            />
          </div>
        </div>

        {/* Content area */}
        <div className={styles['browser-content']}>

          {/* ── State 1: Series showcase ──────────────────────────────── */}
          {viewState === 'root' && (
            <>
              <div className={styles['content-header']}>
                <h2 className={styles['content-title']}>All Series</h2>
                <span className={styles['content-meta']}>{filteredSeries.length} series</span>
              </div>
              <div className={styles['showcase-grid']}>
                {filteredSeries.map((s) => (
                  <button
                    key={s.id}
                    className={styles['showcase-card']}
                    onClick={() => selectSeries(s)}
                  >
                    <div className={styles['showcase-card__media']}>
                      {s.logo && !failedLogos.has(s.id) ? (
                        <img
                          src={s.logo}
                          alt={s.name}
                          className={styles['showcase-card__logo']}
                          onError={() => markLogoFailed(s.id)}
                        />
                      ) : (
                        <span className={styles['showcase-card__name-large']}>{s.name}</span>
                      )}
                    </div>
                    <div className={styles['showcase-card__footer']}>
                      <span className={styles['showcase-card__name']}>{s.name}</span>
                      <svg className={styles['showcase-card__arrow']} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </button>
                ))}
                {filteredSeries.length === 0 && (
                  <p className={styles['empty-msg']}>No series match &ldquo;{filterText}&rdquo;</p>
                )}
              </div>
            </>
          )}

          {/* ── State 2: Sets grid ────────────────────────────────────── */}
          {viewState === 'series' && (
            <>
              {!loadingSeries && !errorSeries && selectedSeries && (
                <div className={styles['content-header']}>
                  <h2 className={styles['content-title']}>{selectedSeries.name}</h2>
                  {seriesDetail?.sets && (
                    <span className={styles['content-meta']}>{filteredSets.length} sets</span>
                  )}
                </div>
              )}
              {loadingSeries && <div className={styles['loading-grid']}>{Array.from({ length: 8 }).map((_, i) => <div key={i} className={styles['skeleton-set']} />)}</div>}
              {errorSeries   && <p className={styles['error-msg']}>{errorSeries}</p>}
              {!loadingSeries && !errorSeries && (
                <div className={styles['sets-grid']}>
                  {filteredSets.map((set) => (
                    <button
                      key={set.id}
                      className={styles['set-card']}
                      onClick={() => selectSet({ id: set.id, name: set.name })}
                    >
                      <div className={styles['set-card__media']}>
                        {set.logo && !failedLogos.has(set.id) ? (
                          <img
                            src={set.logo}
                            alt={set.name}
                            className={styles['set-card__logo']}
                            onError={() => markLogoFailed(set.id)}
                          />
                        ) : (
                          <span className={styles['set-card__fallback']}>{set.name[0]}</span>
                        )}
                      </div>
                      <div className={styles['set-card__info']}>
                        <span className={styles['set-card__name']}>{set.name}</span>
                        {set.cardCount != null && (
                          <span className={styles['set-card__count']}>{set.cardCount} cards</span>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredSets.length === 0 && !loadingSeries && (
                    <p className={styles['empty-msg']}>No sets match &ldquo;{filterText}&rdquo;</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── State 3: Cards grid ───────────────────────────────────── */}
          {viewState === 'set' && (
            <>
              {!loadingSet && !errorSet && (
                <div className={styles['content-header']}>
                  <h2 className={styles['content-title']}>{selectedSet?.name}</h2>
                  {setCards.length > 0 && (
                    <span className={styles['content-meta']}>
                      {filterText ? `${filteredCards.length} of ${setCards.length}` : setCards.length} cards
                    </span>
                  )}
                </div>
              )}
              {loadingSet && <div className={styles['loading-grid']}>{Array.from({ length: 12 }).map((_, i) => <div key={i} className={styles['skeleton-card']} />)}</div>}
              {errorSet   && <p className={styles['error-msg']}>{errorSet}</p>}
              {!loadingSet && !errorSet && (
                <>
                  <ul className={styles['card-grid']} role="list">
                    {filteredCards.map((item) => {
                      const tcgCard = toTcgCard(item, selectedSet?.name ?? '');
                      return (
                        <Card
                          key={item.id}
                          card={tcgCard}
                          onExpand={(c) => onSelect?.(c)}
                          isChased={chaseIds?.has(item.id) ?? false}
                          isCollected={collectionIds?.has(item.id) ?? false}
                        />
                      );
                    })}
                  </ul>
                  {hasMore && (
                    <button
                      className={styles['load-more']}
                      onClick={() => setVisibleCount(n => n + PAGE_SIZE)}
                    >
                      Load more ({setCards.length - visibleCount} remaining)
                    </button>
                  )}
                  {filteredCards.length === 0 && !loadingSet && (
                    <p className={styles['empty-msg']}>No cards match &ldquo;{filterText}&rdquo;</p>
                  )}
                </>
              )}
            </>
          )}

        </div>{/* end browser-content */}
      </div>{/* end browser-main */}
    </div>
  );
}
