'use client';

import { useState, useCallback } from 'react';
import type { TcgCard, SeriesItem } from '$shared/tcg';
import { Card } from '@/lib/components/Card';
import { CardModal } from '@/lib/components/CardModal';
import { SeriesBrowser } from '@/lib/components/SeriesBrowser';
import { LanguageSelector } from '@/lib/components/LanguageSelector';
import styles from './SearchPage.module.css';

const PAGE_SIZE = 20;

interface SearchResult {
  cards: TcgCard[];
  totalCount: number;
}

async function fetchPage(q: string, page: number, lang: string): Promise<SearchResult> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: String(PAGE_SIZE), lang });
  const res = await fetch(`/api/cards/search?${params}`);
  const body = await res.json() as SearchResult & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Search failed (${res.status})`);
  return body;
}

export interface SearchPageProps {
  series: SeriesItem[];
  initialChaseIds: string[];
}

export function SearchPage({ series, initialChaseIds }: SearchPageProps) {
  const [mode, setMode]               = useState<'name' | 'series'>('name');
  const [query, setQuery]             = useState('');
  const [lang, setLang]               = useState('en');
  const [cards, setCards]             = useState<TcgCard[]>([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<TcgCard | null>(null);
  const [chaseIds]                    = useState(new Set(initialChaseIds));

  const hasMore = mode === 'name' && cards.length < totalCount && !error;

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const result = await fetchPage(q, 1, lang);
      setCards(result.cards);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setCards([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [query, lang]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await fetchPage(query.trim(), nextPage, lang);
      setCards(prev => [...prev, ...result.cards]);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, query, lang]);

  return (
    <div className={styles.page}>
      <h1 className={styles['page-title']}>Search Cards</h1>

      <div className={styles['mode-bar']}>
        <button
          className={`${styles['mode-btn']} ${mode === 'name' ? styles['mode-btn--active'] : ''}`}
          onClick={() => { setMode('name'); setCards([]); setError(null); }}
        >
          By Name
        </button>
        <button
          className={`${styles['mode-btn']} ${mode === 'series' ? styles['mode-btn--active'] : ''}`}
          onClick={() => setMode('series')}
        >
          Browse Series
        </button>
      </div>

      {mode === 'name' && (
        <>
          <form className={styles['search-form']} onSubmit={handleSearch}>
            <input
              className={styles['search-input']}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Pokémon cards…"
              aria-label="Search cards by name"
            />
            <LanguageSelector value={lang} onChange={setLang} />
            <button type="submit" className={styles['search-btn']} disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error && <p className={styles['search-error']}>{error}</p>}

          {cards.length > 0 && (
            <>
              <p className={styles['result-count']}>
                Showing {cards.length} of {totalCount} results
              </p>
              <ul className={styles['card-grid']} role="list">
                {cards.map((card) => (
                  <Card key={card.id} card={card} onExpand={setExpandedCard} />
                ))}
              </ul>
              {hasMore && (
                <button
                  className={styles['load-more']}
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : `Load more (${totalCount - cards.length} remaining)`}
                </button>
              )}
            </>
          )}

          {!loading && !error && cards.length === 0 && query && (
            <p className={styles['no-results']}>No cards found for &ldquo;{query}&rdquo;</p>
          )}
        </>
      )}

      {mode === 'series' && (
        <SeriesBrowser series={series} onSelect={setExpandedCard} />
      )}

      {expandedCard && (
        <CardModal
          card={expandedCard}
          chaseIds={chaseIds}
          onClose={() => setExpandedCard(null)}
        />
      )}
    </div>
  );
}
