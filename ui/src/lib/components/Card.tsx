'use client';

import { useState, useCallback } from 'react';
import type { TcgCard } from '$shared/tcg';
import { useSpring } from '@/lib/hooks/useSpring';
import { HoverTilt } from './HoverTilt';
import styles from './Card.module.css';

export interface CardProps {
  card: TcgCard;
  onExpand: (card: TcgCard) => void;
  isChased?: boolean;
  isCollected?: boolean;
}

// ── Math helpers ─────────────────────────────────────────────────────────────
const round  = (v: number, p = 3) => parseFloat(v.toFixed(p));
const clamp  = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + (tMax - tMin) * ((v - fMin) / (fMax - fMin)));

// ── Rarity normalisation ──────────────────────────────────────────────────────
function resolveRarity(raw: string): string {
  const r = raw.toLowerCase().trim();
  if (r.endsWith('reverse holo'))                                          return r;
  if (r === 'rare holo cosmos')                                            return 'rare holo cosmos';
  if (r === 'rare holo v')                                                 return 'rare holo v';
  if (r === 'rare holo vmax' || r === 'rare holo vstar')                   return 'rare holo vmax';
  if (r.startsWith('rare holo'))                                           return 'rare holo';
  if (r === 'rare rainbow')                                                return 'rare rainbow';
  if (r === 'rare secret' || r === 'hyper rare' || r === 'ace spec rare')  return 'rare secret';
  if (r === 'rare ultra'  || r === 'double rare'  || r === 'ultra rare')   return 'rare ultra';
  if (r === 'rare shiny'  || r === 'rare shiny gx' || r === 'rare shining' || r === 'legend') return 'rare ultra';
  if (r === 'rare prime'  || r === 'rare prism star')                      return 'rare holo';
  if (r === 'special illustration rare' || r === 'illustration rare')      return 'illustration rare';
  if (r === 'amazing rare')                                                return 'amazing rare';
  return r;
}

const SI = { stiffness: 0.066, damping: 0.25 };

export function Card({ card, onExpand, isChased = false, isCollected = false }: CardProps) {
  const [seed] = useState(() => ({ x: Math.random(), y: Math.random() }));

  const [springGlare, setSpringGlare] = useSpring({ x: 50, y: 50, o: 0 }, SI);
  const [springBg,    setSpringBg   ] = useSpring({ x: 50, y: 50 },        SI);

  const [interacting, setInteracting] = useState(false);
  const [imgSrcIdx,   setImgSrcIdx  ] = useState(0);

  const imgSrcs = card.images?.small
    ? [card.images.small, card.images.small.replace('.webp', '.png')]
    : [];
  const currentCardSrc = imgSrcs[imgSrcIdx] ?? '';

  const handleImgError = useCallback(() => {
    setImgSrcIdx(i => Math.min(i + 1, imgSrcs.length));
  }, [imgSrcs.length]);

  // ── Holo interaction ────────────────────────────────────────────────────────
  const interact = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setInteracting(true);
    const el   = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const pct  = {
      x: clamp(round((100 / rect.width)  * (e.clientX - rect.left))),
      y: clamp(round((100 / rect.height) * (e.clientY - rect.top))),
    };
    setSpringGlare({ x: pct.x, y: pct.y, o: 1 });
    setSpringBg({
      x: adjust(pct.x, 0, 100, 37, 63),
      y: adjust(pct.y, 0, 100, 33, 67),
    });
  }, [setSpringGlare, setSpringBg]);

  const interactEnd = useCallback(() => {
    setInteracting(false);
    setSpringGlare({ x: 50, y: 50, o: 0 }, { soft: 1 });
    setSpringBg({ x: 50, y: 50 }, { soft: 1 });
  }, [setSpringGlare, setSpringBg]);

  // ── Derived attributes ──────────────────────────────────────────────────────
  const dataRarity   = resolveRarity(card.rarity ?? '');
  const subtypesStr  = (card.subtypes  ?? []).join(' ').toLowerCase();
  const supertypeStr = (card.supertype ?? '').toLowerCase();
  const typesStr     = (card.types     ?? []).join(' ').toLowerCase();

  // ── CSS variables ────────────────────────────────────────────────────────────
  const g = springGlare;
  const bg = springBg;
  const fromCenter = clamp(
    Math.sqrt((g.y - 50) ** 2 + (g.x - 50) ** 2) / 50, 0, 1
  );

  const dynStyle: React.CSSProperties = {
    '--pointer-x':           `${g.x}%`,
    '--pointer-y':           `${g.y}%`,
    '--pointer-from-center': fromCenter,
    '--pointer-from-top':    g.y / 100,
    '--pointer-from-left':   g.x / 100,
    '--card-opacity':        g.o,
    '--background-x':        `${bg.x}%`,
    '--background-y':        `${bg.y}%`,
    '--seedx':               seed.x,
    '--seedy':               seed.y,
  } as React.CSSProperties;

  // Build className: base 'card' + type class(es) — CSS Module handles compound selectors
  const cardClassName = [
    styles.card,
    ...typesStr.split(' ').filter(Boolean).map(t => styles[t] ?? t),
    interacting ? styles.interacting : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      data-rarity={dataRarity}
      data-subtypes={subtypesStr}
      data-supertype={supertypeStr}
      style={dynStyle}
      role="listitem"
    >
      {isCollected && (
        <span className={styles['card__collected-badge']} aria-label="In your collection">✓</span>
      )}
      {isChased && (
        <span className={styles['card__chase-badge']} aria-label="On your chase list">★</span>
      )}
      <HoverTilt tiltFactor={1.5} scaleFactor={1.04} shadow={true}>
        <div
          className={styles['card__rotator']}
          role="button"
          tabIndex={0}
          onPointerMove={interact}
          onPointerLeave={interactEnd}
          onClick={() => onExpand(card)}
          onKeyPress={(e) => e.key === 'Enter' && onExpand(card)}
        >
          <div className={styles['card__front']}>
            {currentCardSrc ? (
              <img
                src={currentCardSrc}
                alt={card.name}
                loading="lazy"
                width={245}
                height={342}
                onError={handleImgError}
              />
            ) : (
              <div className={styles['card__fallback']} aria-label={card.name}>
                <span>{card.name}</span>
              </div>
            )}
            <div className={styles['card__shine']} aria-hidden="true" />
            <div className={styles['card__glare']}  aria-hidden="true" />
          </div>
        </div>
      </HoverTilt>

      <div className={styles['card-info']}>
        <h3 className={styles['card-name']}>{card.name}</h3>
        <p className={styles['card-meta']}>{card.set} · {card.number}</p>
      </div>
    </div>
  );
}
