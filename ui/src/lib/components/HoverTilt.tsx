'use client';

import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useSpring } from '@/lib/hooks/useSpring';
import styles from './HoverTilt.module.css';

export interface HoverTiltProps {
  children: ReactNode;
  tiltFactor?: number;
  tiltFactorY?: number;
  scaleFactor?: number;
  springOptions?: { stiffness?: number; damping?: number };
  enterDelay?: number;
  exitDelay?: number;
  shadow?: boolean;
  shadowBlur?: number;
  glareIntensity?: number;
  glareHue?: number;
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export function HoverTilt({
  children,
  tiltFactor = 1,
  tiltFactorY,
  scaleFactor = 1,
  springOptions = {},
  enterDelay = 0,
  exitDelay = 200,
  shadow = false,
  shadowBlur = 12,
  glareIntensity = 1,
  glareHue = 270,
}: HoverTiltProps) {
  const { stiffness = 0.2, damping = 0.8 } = springOptions;
  const fastConfig = { stiffness, damping };
  const slowConfig = { stiffness: stiffness * 0.2, damping: damping * 0.5 };

  const [activation, setActivation] = useSpring({ v: 0 }, fastConfig);
  const [position, setPosition] = useSpring({ x: 0.5, y: 0.5 }, fastConfig);

  const configRef = useRef({ stiffness, damping, fastConfig, slowConfig });
  useEffect(() => {
    configRef.current = {
      stiffness, damping,
      fastConfig: { stiffness, damping },
      slowConfig: { stiffness: stiffness * 0.2, damping: damping * 0.5 },
    };
  }, [stiffness, damping]);

  const isActiveRef = useRef(false);
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [, forceRender] = useState(0);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (exitTimeoutRef.current)  clearTimeout(exitTimeoutRef.current);

    const node = e.currentTarget;
    const rect = node.getBoundingClientRect();
    const nx = clamp01((e.clientX - rect.left) / (rect.width || 1));
    const ny = clamp01((e.clientY - rect.top)  / (rect.height || 1));

    const start = () => {
      isActiveRef.current = true;
      setActivation({ v: 1 });
      setPosition({ x: nx, y: ny });
      forceRender(n => n + 1);
    };

    if (enterDelay > 0) {
      enterTimeoutRef.current = setTimeout(start, enterDelay);
    } else {
      start();
    }
  }, [enterDelay, setActivation, setPosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActiveRef.current) return;
    const node = e.currentTarget;
    const rect = node.getBoundingClientRect();
    const nx = clamp01((e.clientX - rect.left) / (rect.width || 1));
    const ny = clamp01((e.clientY - rect.top)  / (rect.height || 1));
    setPosition({ x: nx, y: ny });
  }, [setPosition]);

  const handlePointerLeave = useCallback(() => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (exitTimeoutRef.current)  clearTimeout(exitTimeoutRef.current);

    exitTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      setPosition({ x: 0.5, y: 0.5 }, { soft: 1 });
      setActivation({ v: 0 }, { soft: 1 });
    }, exitDelay);
  }, [exitDelay, setActivation, setPosition]);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (exitTimeoutRef.current)  clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  const ROTATION = 10;
  const rotX = ROTATION * tiltFactor;
  const rotY = ROTATION * (tiltFactorY ?? tiltFactor);
  const act  = activation.v;
  const scaleVal = 1 + (scaleFactor - 1) * act;

  // Compute dynamic CSS variables
  const px = position.x, py = position.y;
  const dx = (px - 0.5) * 2, dy = (py - 0.5) * 2;
  const gradientX = `${px * 100}%`;
  const gradientY = `${py * 100}%`;
  const shadowX = dx, shadowY = dy;
  const rotationX = `calc(${py * 2 - 1} * ${rotY}deg)`;
  const rotationY = `calc(${(1 - px) * 2 - 1} * ${rotX}deg)`;
  const scale = scaleVal;

  const containerStyle: React.CSSProperties = {
    '--hover-tilt-x': px,
    '--hover-tilt-y': py,
    '--hover-tilt-opacity': act,
    '--hover-tilt-scale': scaleVal,
    '--hover-tilt-rotation-x': `${rotX}deg`,
    '--hover-tilt-rotation-y': `${rotY}deg`,
    '--hover-tilt-shadow-blur': shadowBlur,
    '--hover-tilt-blend-mode': 'overlay',
    '--hover-tilt-glare-intensity': glareIntensity,
    '--hover-tilt-glare-hue': glareHue,
    '--shadow-x': shadowX,
    '--shadow-y': shadowY,
    '--gradient-x': gradientX,
    '--gradient-y': gradientY,
    '--scale': scale,
    '--rotation-x': rotationX,
    '--rotation-y': rotationY,
  } as React.CSSProperties;

  const tiltClassName = [
    styles['hover-tilt'],
    shadow ? styles['hover-tilt-shadow'] : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles['hover-tilt-container']} style={containerStyle}>
      <div
        className={tiltClassName}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={handlePointerEnter}
      >
        {children}
      </div>
    </div>
  );
}
