import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpring } from './useSpring';

let rafId = 0;
const pending = new Map<number, FrameRequestCallback>();

beforeEach(() => {
  vi.useFakeTimers();
  rafId = 0;
  pending.clear();

  // Override the setup.ts stubs with timer-controlled versions (direct assignment, not vi.stubGlobal)
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = ++rafId;
    pending.set(id, cb);
    setTimeout(() => {
      const fn = pending.get(id);
      if (fn) { pending.delete(id); fn(performance.now()); }
    }, 16);
    return id;
  };

  global.cancelAnimationFrame = (id: number) => {
    pending.delete(id);
  };
});

afterEach(() => {
  vi.useRealTimers();
  // Restore to setup.ts fallback stubs
  global.requestAnimationFrame = (cb: FrameRequestCallback) => { setTimeout(() => cb(Date.now()), 16); return 0; };
  global.cancelAnimationFrame = (_id: number) => {};
});

function advanceFrames(n: number) {
  for (let i = 0; i < n; i++) {
    act(() => { vi.advanceTimersByTime(16); });
  }
}

describe('useSpring', () => {
  it('settles to scalar target', () => {
    const { result } = renderHook(() =>
      useSpring({ x: 0 }, { stiffness: 0.3, damping: 0.8 })
    );
    act(() => { result.current[1]({ x: 100 }); });
    advanceFrames(120);
    expect(result.current[0].x).toBeCloseTo(100, 0);
  });

  it('high stiffness converges faster than low stiffness', () => {
    const { result: fast } = renderHook(() =>
      useSpring({ x: 0 }, { stiffness: 0.5, damping: 0.5 })
    );
    const { result: slow } = renderHook(() =>
      useSpring({ x: 0 }, { stiffness: 0.01, damping: 0.5 })
    );
    act(() => {
      fast.current[1]({ x: 100 });
      slow.current[1]({ x: 100 });
    });
    advanceFrames(20);
    expect(fast.current[0].x).toBeGreaterThan(slow.current[0].x);
  });

  it('low damping produces overshoot (underdamped)', () => {
    const { result } = renderHook(() =>
      useSpring({ x: 0 }, { stiffness: 0.3, damping: 0.06 })
    );
    act(() => { result.current[1]({ x: 100 }); });
    let maxSeen = 0;
    for (let i = 0; i < 100; i++) {
      act(() => { vi.advanceTimersByTime(16); });
      if (result.current[0].x > maxSeen) maxSeen = result.current[0].x;
    }
    expect(maxSeen).toBeGreaterThan(100);
  });

  it('soft-set transitions smoothly without abrupt reversal', () => {
    const { result } = renderHook(() =>
      useSpring({ x: 0 }, { stiffness: 0.3, damping: 0.06 })
    );
    act(() => { result.current[1]({ x: 100 }); });
    advanceFrames(15);
    const midValue = result.current[0].x;
    act(() => { result.current[1]({ x: 0 }, { soft: 1 }); });
    act(() => { vi.advanceTimersByTime(16); });
    // One frame after soft-set should still be near midValue (no abrupt jump)
    expect(result.current[0].x).toBeGreaterThan(midValue * 0.5);
  });
});
