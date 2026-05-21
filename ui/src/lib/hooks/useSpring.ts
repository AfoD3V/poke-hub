'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
}

export interface SoftSetOptions {
  soft?: number;
}

type NumericObject = Record<string, number>;

function isSettled(value: NumericObject, target: NumericObject, velocity: NumericObject): boolean {
  return Object.keys(value).every(
    (k) => Math.abs(value[k] - target[k]) < 0.001 && Math.abs(velocity[k]) < 0.001,
  );
}

export function useSpring<T extends NumericObject>(
  initialValue: T,
  config: SpringConfig = {},
): [T, (target: T, opts?: SoftSetOptions) => void] {
  const { stiffness = 0.15, damping = 0.8 } = config;

  const valueRef    = useRef<NumericObject>({ ...initialValue });
  const velocityRef = useRef<NumericObject>(
    Object.fromEntries(Object.keys(initialValue).map((k) => [k, 0])),
  );
  const targetRef = useRef<NumericObject>({ ...initialValue });
  const configRef = useRef({ stiffness, damping });
  const rafRef    = useRef<number | null>(null);
  // Holds the latest frame callback so it can reference itself without TDZ issues
  const frameRef  = useRef<FrameRequestCallback>(() => {});

  const [displayValue, setDisplayValue] = useState<T>({ ...initialValue });

  useEffect(() => {
    configRef.current = { stiffness, damping };
  }, [stiffness, damping]);

  // Assign the frame callback once — stable reference, reads latest state via refs
  useEffect(() => {
    frameRef.current = () => {
      const { stiffness: s, damping: d } = configRef.current;
      const value    = valueRef.current;
      const velocity = velocityRef.current;
      const target   = targetRef.current;
      const keys     = Object.keys(value);

      const newValue:    NumericObject = { ...value };
      const newVelocity: NumericObject = { ...velocity };

      for (const k of keys) {
        // Svelte spring ODE: velocity += (target - value) * stiffness; velocity *= (1 - damping); value += velocity
        newVelocity[k] = (newVelocity[k] + (target[k] - newValue[k]) * s) * (1 - d);
        newValue[k] += newVelocity[k];
      }

      valueRef.current    = newValue;
      velocityRef.current = newVelocity;
      setDisplayValue(newValue as T);

      if (!isSettled(newValue, target, newVelocity)) {
        rafRef.current = requestAnimationFrame(frameRef.current);
      } else {
        rafRef.current = null;
      }
    };
  });

  const set = useCallback(
    (target: T, opts?: SoftSetOptions) => {
      targetRef.current = target;

      if (opts?.soft) {
        const velocity = velocityRef.current;
        const keys = Object.keys(velocity);
        const dampFactor = Math.max(0, 1 - opts.soft);
        const newVelocity: NumericObject = {};
        for (const k of keys) {
          newVelocity[k] = velocity[k] * dampFactor;
        }
        velocityRef.current = newVelocity;
      }

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return [displayValue, set];
}
