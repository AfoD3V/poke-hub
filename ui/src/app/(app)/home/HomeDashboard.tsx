'use client';

import { useState } from 'react';
import type { ChaseEntry, TcgCard } from '$shared/tcg';
import { CardModal } from '@/lib/components/CardModal';
import styles from './HomeDashboard.module.css';

const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Special Rare', 'Secret Rare', 'Other'];

const SET_THEME: Record<string, string> = {
  base:   'rgba(140, 12, 12, 0.55)',
  jungle: 'rgba(12, 100, 30, 0.55)',
  fossil: 'rgba(100, 90, 20, 0.55)',
  neo:    'rgba(12, 30, 140, 0.55)',
  hgss:   'rgba(20, 70, 130, 0.55)',
  bw:     'rgba(50, 50, 50, 0.55)',
  xy:     'rgba(80, 12, 140, 0.55)',
  sm:     'rgba(12, 100, 70, 0.55)',
  swsh:   'rgba(12, 80, 120, 0.55)',
  sv:     'rgba(90, 12, 140, 0.55)',
};

function panelGradient(setId: string): string {
  const prefix = Object.keys(SET_THEME).find((k) => setId.startsWith(k));
  const color   = prefix ? SET_THEME[prefix] : 'rgba(40, 32, 100, 0.55)';
  return `linear-gradient(to right, ${color} 0%, rgba(18,18,30,0) 85%), #12121e`;
}

function resolveSetId(entry: ChaseEntry): string {
  if (entry.cardSnapshot.setId) return entry.cardSnapshot.setId;
  const lastDash = entry.cardId.lastIndexOf('-');
  return lastDash > 0 ? entry.cardId.slice(0, lastDash) : '';
}

export interface HomeDashboardProps {
  totalCards: number;
  uniquePokemon: number;
  setBreakdown: { name: string; count: number }[];
  rarityBreakdown: Record<string, number>;
  chaseEntries: ChaseEntry[];
  setLogos: Record<string, string>;
  setNames: Record<string, string>;
  error?: string;
}

export function HomeDashboard({
  totalCards, uniquePokemon, setBreakdown, rarityBreakdown,
  chaseEntries, setLogos, error,
}: HomeDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'chase'>('overview');
  const [expandedCard, setExpandedCard] = useState<TcgCard | null>(null);

  const chaseIds = new Set(chaseEntries.map((e) => e.cardId));

  const chaseBySet = (() => {
    const map = new Map<string, { entries: ChaseEntry[]; setId: string }>();
    for (const e of chaseEntries) {
      const setName = e.cardSnapshot.setName || 'Unknown Set';
      const setId   = resolveSetId(e);
      if (!map.has(setName)) map.set(setName, { entries: [], setId });
      map.get(setName)!.entries.push(e);
    }
    return Array.from(map.entries()).map(([setName, { entries, setId }]) => ({
      setName, entries, setId,
      setLogo: setLogos[setId] ?? '',
    }));
  })();

  function openChaseCard(entry: ChaseEntry) {
    setExpandedCard({
      id: entry.cardId,
      name: entry.cardSnapshot.name,
      supertype: 'Pokémon',
      set: entry.cardSnapshot.setName,
      number: '',
      images: { small: entry.cardSnapshot.imageSmall, large: entry.cardSnapshot.imageSmall },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles['page-header']}>
        <h1 className={styles['page-title']}>Welcome to PokeHub</h1>
        <p className={styles['page-subtitle']}>Your personal Pokémon TCG collection manager.</p>
      </div>

      {error && <div className={styles['page-error']}>{error}</div>}

      <div className={styles['tab-bar']} role="tablist" aria-label="Home sections">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`${styles['tab-btn']} ${activeTab === 'overview' ? styles['tab-active'] : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'chase'}
          className={`${styles['tab-btn']} ${activeTab === 'chase' ? styles['tab-active'] : ''}`}
          onClick={() => setActiveTab('chase')}
        >
          Chase Board
          {chaseEntries.length > 0 && (
            <span className={styles['tab-badge']}>{chaseEntries.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className={styles['section-label']}>Collection Stats</h2>

          <div className={styles['stat-grid']}>
            <div className={styles['stat-card']}>
              <p className={styles['stat-label']}>Total Cards</p>
              <p className={styles['stat-value']}>{totalCards}</p>
            </div>
            <div className={styles['stat-card']}>
              <p className={styles['stat-label']}>Unique Pokémon</p>
              <p className={styles['stat-value']}>{uniquePokemon}</p>
            </div>
          </div>

          {totalCards > 0 && (
            <div className={styles['breakdown-grid']}>
              {setBreakdown.length > 0 && (
                <div className={styles['breakdown-card']}>
                  <p className={styles['section-label']}>By Set</p>
                  <ul className={styles['breakdown-list']}>
                    {setBreakdown.slice(0, 8).map(({ name, count }) => (
                      <li key={name} className={styles['breakdown-row']}>
                        <span className={styles['breakdown-name']}>{name}</span>
                        <div className={styles['breakdown-bar-wrap']}>
                          <div
                            className={styles['breakdown-bar']}
                            style={{ width: `${Math.max(8, (count / setBreakdown[0].count) * 80)}px` }}
                            aria-hidden="true"
                          />
                          <span className={styles['breakdown-count']}>{count}</span>
                        </div>
                      </li>
                    ))}
                    {setBreakdown.length > 8 && (
                      <li className={styles['breakdown-more']}>+{setBreakdown.length - 8} more sets</li>
                    )}
                  </ul>
                </div>
              )}

              {Object.keys(rarityBreakdown).length > 0 && (
                <div className={styles['breakdown-card']}>
                  <p className={styles['section-label']}>By Rarity</p>
                  <ul className={styles['breakdown-list']}>
                    {RARITY_ORDER.filter((r) => rarityBreakdown[r]).map((rarity) => (
                      <li key={rarity} className={styles['rarity-row']}>
                        <span className={styles['rarity-name']}>{rarity}</span>
                        <span className={styles['rarity-count']}>{rarityBreakdown[rarity]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className={styles['quick-actions']}>
            <h2 className={styles['section-label']}>Quick Actions</h2>
            <a href="/search" className={`${styles['action-link']} ${styles['action-link--accent']}`}>
              <svg className={styles['action-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <div>
                <p className={styles['action-title']}>Search Cards</p>
                <p className={styles['action-desc']}>Find and add Pokémon cards</p>
              </div>
            </a>
            <a href="/collection" className={`${styles['action-link']} ${styles['action-link--surface']}`}>
              <svg className={styles['action-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <div>
                <p className={styles['action-title']}>My Collection</p>
                <p className={styles['action-desc']}>
                  {totalCards === 0
                    ? 'No cards yet — start searching!'
                    : `${totalCards} card${totalCards === 1 ? '' : 's'} in your collection`}
                </p>
              </div>
            </a>
          </div>
        </section>
      )}

      {activeTab === 'chase' && (
        <>
          {chaseEntries.length === 0 ? (
            <div className={styles['chase-empty']}>
              <svg className={styles['chase-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
              </svg>
              <p className={styles['chase-empty-text']}>No cards on your Chase Board yet.</p>
              <p className={styles['chase-empty-hint']}>Search for cards and mark them as &ldquo;Chasing&rdquo; to track them here.</p>
            </div>
          ) : (
            <div className={styles['chase-list']}>
              {chaseBySet.map(({ setName, setLogo, setId, entries }) => (
                <div key={setName} className={styles['chase-set-card']} style={{ background: panelGradient(setId) }}>
                  <div className={styles['chase-set-identity']}>
                    {setLogo && (
                      <img
                        src={setLogo}
                        alt={`${setName} logo`}
                        className={styles['chase-set-logo-img']}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <p className={styles['chase-set-name']}>{setName}</p>
                    <span className={styles['chase-count-pill']}>· {entries.length} card{entries.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className={styles['chase-cards-row']}>
                    {entries.map((entry) => (
                      <button
                        key={entry.id}
                        className={styles['chase-thumb']}
                        onClick={() => openChaseCard(entry)}
                        aria-label={`View ${entry.cardSnapshot.name}`}
                        title={entry.cardSnapshot.name}
                      >
                        {entry.cardSnapshot.imageSmall ? (
                          <img
                            src={entry.cardSnapshot.imageSmall}
                            alt={entry.cardSnapshot.name}
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className={styles['chase-thumb-placeholder']}>?</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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
