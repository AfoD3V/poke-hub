'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TcgCard } from '$shared/tcg';
import { useSpring } from '@/lib/hooks/useSpring';
import styles from './CardModal.module.css';

export interface CardModalProps {
  card: TcgCard;
  chaseIds?: Set<string>;
  collectionIds?: Set<string>;
  onClose: () => void;
  onChaseChange?: (cardId: string, added: boolean) => void;
  onCollectionAdd?: (cardId: string) => void;
  onCollectionRemove?: (cardId: string) => void;
}

const round  = (v: number, p = 3) => parseFloat(v.toFixed(p));
const clamp  = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + (tMax - tMin) * ((v - fMin) / (fMax - fMin)));

function resolveRarity(raw: string): string {
  const r = raw.toLowerCase().trim();
  if (r.endsWith('reverse holo'))                                          return r;
  if (r === 'rare holo cosmos')                                            return 'rare holo cosmos';
  if (r === 'rare holo v')                                                 return 'rare holo v';
  if (r === 'rare holo vmax' || r === 'rare holo vstar')                   return 'rare holo vmax';
  if (r.startsWith('rare holo'))                                           return 'rare holo';
  if (r === 'rare rainbow')                                                return 'rare rainbow';
  if (r === 'rare secret' || r === 'hyper rare' || r === 'ace spec rare')  return 'rare secret';
  if (r === 'rare ultra'  || r === 'double rare' || r === 'ultra rare')    return 'rare ultra';
  if (r === 'rare shiny'  || r === 'rare shiny gx' || r === 'rare shining' || r === 'legend') return 'rare ultra';
  if (r === 'rare prime'  || r === 'rare prism star')                      return 'rare holo';
  if (r === 'special illustration rare' || r === 'illustration rare')      return 'illustration rare';
  if (r === 'amazing rare')                                                return 'amazing rare';
  return r;
}

const SI = { stiffness: 0.066, damping: 0.25 };

export function CardModal({ card, chaseIds = new Set(), collectionIds = new Set(), onClose, onChaseChange, onCollectionAdd, onCollectionRemove }: CardModalProps) {
  const [seed] = useState(() => ({ x: Math.random(), y: Math.random() }));

  const [springRotate, setSpringRotate] = useSpring({ x: 0,  y: 0  }, SI);
  const [springGlare,  setSpringGlare ] = useSpring({ x: 50, y: 50, o: 0 }, SI);
  const [springBg,     setSpringBg    ] = useSpring({ x: 50, y: 50 }, SI);

  const [interacting, setInteracting] = useState(false);
  const [flipped,     setFlipped    ] = useState(false);
  const [imgSrcIdx,   setImgSrcIdx  ] = useState(0);

  // Collection state
  type CollectionState = 'idle' | 'adding' | 'collected' | 'removing' | 'error';
  const [collectionState, setCollectionState] = useState<CollectionState>(() => collectionIds.has(card.id) ? 'collected' : 'idle');
  const [collectionError, setCollectionError] = useState('');
  const [localChasing, setLocalChasing] = useState<boolean | null>(null);
  const [chaseLoading, setChaseLoading] = useState(false);

  const isChasing = localChasing !== null ? localChasing : chaseIds.has(card.id);

  const imgSrcs = (() => {
    const large = card.images?.large ?? '';
    const small = card.images?.small ?? '';
    const srcs: string[] = [];
    if (large) srcs.push(large);
    if (small && small !== large) srcs.push(small);
    if (large) srcs.push(large.replace('.webp', '.png'));
    if (small && small !== large) srcs.push(small.replace('.webp', '.png'));
    return srcs;
  })();
  const modalImgSrc = imgSrcs[imgSrcIdx] ?? (card.images?.small ?? '');

  // Trigger flip after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFlipped(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const interact = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setInteracting(true);
    const el   = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const pct  = {
      x: clamp(round((100 / rect.width)  * (e.clientX - rect.left))),
      y: clamp(round((100 / rect.height) * (e.clientY - rect.top))),
    };
    const center = { x: pct.x - 50, y: pct.y - 50 };
    setSpringRotate({ x: round(-(center.x / 3.5)), y: round(center.y / 3.5) });
    setSpringGlare({ x: pct.x, y: pct.y, o: 1 });
    setSpringBg({ x: adjust(pct.x, 0, 100, 37, 63), y: adjust(pct.y, 0, 100, 33, 67) });
  }, [setSpringRotate, setSpringGlare, setSpringBg]);

  const interactEnd = useCallback(() => {
    setInteracting(false);
    setSpringRotate({ x: 0, y: 0 }, { soft: 1 });
    setSpringGlare({ x: 50, y: 50, o: 0 }, { soft: 1 });
    setSpringBg({ x: 50, y: 50 }, { soft: 1 });
  }, [setSpringRotate, setSpringGlare, setSpringBg]);

  const toggleChase = useCallback(async () => {
    if (chaseLoading) return;
    const newVal = !isChasing;
    setLocalChasing(newVal);
    setChaseLoading(true);
    try {
      if (newVal) {
        const res = await fetch('/api/chase/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id, cardSnapshot: {
            name: card.name, setName: card.set, setId: '',
            imageSmall: card.images?.small ?? ''
          }}),
        });
        if (!res.ok) throw new Error('Failed');
      } else {
        const res = await fetch('/api/chase/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: card.id }),
        });
        if (!res.ok) throw new Error('Failed');
      }
      onChaseChange?.(card.id, newVal);
    } catch {
      setLocalChasing(!newVal);
    } finally {
      setChaseLoading(false);
    }
  }, [chaseLoading, isChasing, card, onChaseChange]);

  const addToCollection = useCallback(async () => {
    if (collectionState === 'adding' || collectionState === 'collected') return;
    setCollectionState('adding');
    setCollectionError('');
    try {
      const res = await fetch('/api/collection/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, card }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setCollectionState('collected');
      onCollectionAdd?.(card.id);
    } catch (e) {
      setCollectionError(e instanceof Error ? e.message : 'Failed to add card');
      setCollectionState('error');
    }
  }, [collectionState, card, onCollectionAdd]);

  const removeFromCollection = useCallback(async () => {
    if (collectionState === 'removing') return;
    setCollectionState('removing');
    setCollectionError('');
    try {
      const res = await fetch('/api/collection/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setCollectionState('idle');
      onCollectionRemove?.(card.id);
      onClose();
    } catch (e) {
      setCollectionError(e instanceof Error ? e.message : 'Failed to remove card');
      setCollectionState('collected');
    }
  }, [collectionState, card, onCollectionRemove]);

  const dataRarity   = resolveRarity(card.rarity ?? '');
  const subtypesStr  = (card.subtypes  ?? []).join(' ').toLowerCase();
  const supertypeStr = (card.supertype ?? '').toLowerCase();
  const typesStr     = (card.types     ?? []).join(' ').toLowerCase();

  const g  = springGlare;
  const bg = springBg;
  const r  = springRotate;

  const dynStyle: React.CSSProperties = {
    '--pointer-x':           `${g.x}%`,
    '--pointer-y':           `${g.y}%`,
    '--pointer-from-center': clamp(Math.sqrt((g.y - 50) ** 2 + (g.x - 50) ** 2) / 50, 0, 1),
    '--pointer-from-top':    g.y / 100,
    '--pointer-from-left':   g.x / 100,
    '--card-opacity':        g.o,
    '--rotate-x':            `${r.x}deg`,
    '--rotate-y':            `${r.y}deg`,
    '--background-x':        `${bg.x}%`,
    '--background-y':        `${bg.y}%`,
    '--seedx':               seed.x,
    '--seedy':               seed.y,
  } as React.CSSProperties;

  const frontClassName = [
    styles.face,
    styles['face--front'],
    styles.card,
    ...typesStr.split(' ').filter(Boolean).map(t => styles[t] ?? t),
    interacting ? styles.interacting : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={styles.overlay}
      data-testid="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Card detail — ${card.name}`}
      tabIndex={-1}
    >
      <button className={styles['close-btn']} onClick={onClose} aria-label="Close">×</button>

      <div className={styles['modal-content']} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles['flip-shadow-wrap']}>
        <div className={`${styles['flip-wrap']} ${flipped ? styles.flipped : ''}`}>
          {/* Back face */}
          <div className={`${styles.face} ${styles['face--back']}`}>
            <div className={styles['face-inner']}>
              <img
                src="https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg"
                alt="Card back"
                width={660}
                height={921}
                draggable={false}
              />
            </div>
          </div>

          {/* Front face */}
          <div
            className={frontClassName}
            data-rarity={dataRarity}
            data-subtypes={subtypesStr}
            data-supertype={supertypeStr}
            style={dynStyle}
            onPointerMove={interact}
            onPointerLeave={interactEnd}
          >
            <div className={styles['face-inner']}>
              <div className={styles['card__perspective']}>
                <div className={styles['card__rotator']}>
                  <img
                    src={modalImgSrc}
                    alt={card.name}
                    width={660}
                    height={921}
                    draggable={false}
                    onError={() => setImgSrcIdx(i => Math.min(i + 1, imgSrcs.length))}
                  />
                  <div className={styles['card__shine']} aria-hidden="true" />
                  <div className={styles['card__glare']}  aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{/* end flip-shadow-wrap */}

      {/* Info panel */}
      <aside className={styles['info-panel']}>
        <div className={styles['info-scroll']}>
          <h2 className={styles['card-title']}>{card.name}</h2>
          {card.rarity && <span className={styles['rarity-pill']}>{card.rarity}</span>}
          <p className={styles['set-line']}>{card.set} &middot; #{card.number}</p>

          <dl className={styles.stats}>
            {card.hp && (
              <div className={styles['stat-row']}><dt>HP</dt><dd>{card.hp}</dd></div>
            )}
            {(card.types?.length ?? 0) > 0 && (
              <div className={styles['stat-row']}><dt>Type</dt><dd>{card.types!.join(' / ')}</dd></div>
            )}
            {card.supertype && (
              <div className={styles['stat-row']}><dt>Category</dt><dd>{card.supertype}</dd></div>
            )}
            {(card.subtypes?.length ?? 0) > 0 && (
              <div className={styles['stat-row']}><dt>Stage</dt><dd>{card.subtypes!.join(', ')}</dd></div>
            )}
          </dl>
        </div>

        <div className={styles['action-row']}>
          <button
            className={`${styles['chase-btn']} ${isChasing ? styles['chase-btn--active'] : ''}`}
            disabled={chaseLoading}
            onClick={toggleChase}
            aria-label={`${isChasing ? 'Remove' : 'Add'} ${card.name} ${isChasing ? 'from' : 'to'} chase list`}
          >
            <span className={styles['btn-icon']}>★</span>
            {isChasing ? 'Chasing' : 'Chase'}
          </button>

          {collectionState !== 'collected' && collectionState !== 'removing' ? (
            <button
              className={`${styles['add-btn']} ${collectionState === 'error' ? styles['add-btn--error'] : ''}`}
              disabled={collectionState === 'adding'}
              onClick={addToCollection}
              aria-label={`Add ${card.name} to collection`}
            >
              <span className={styles['btn-icon']}>✓</span>
              {collectionState === 'idle' && 'Collection'}
              {collectionState === 'adding' && 'Adding…'}
              {collectionState === 'error' && 'Retry'}
            </button>
          ) : (
            <button
              className={`${styles['add-btn']} ${styles['add-btn--remove']}`}
              disabled={collectionState === 'removing'}
              onClick={removeFromCollection}
              aria-label={`Remove ${card.name} from collection`}
            >
              <span className={styles['btn-icon']}>✕</span>
              {collectionState === 'removing' ? 'Removing…' : 'Remove'}
            </button>
          )}

          {collectionState === 'error' && <p className={styles['add-error']}>{collectionError}</p>}
        </div>
      </aside>
      </div>{/* end modal-content */}
    </div>
  );
}
