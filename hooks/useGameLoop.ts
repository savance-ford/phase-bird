// requestAnimationFrame-based game loop hook
import { useEffect, useRef } from 'react';

/**
 * Runs `tick(deltaMs)` every animation frame while `running` is true.
 * Automatically stops and cleans up when `running` becomes false or component unmounts.
 */
export function useGameLoop(tick: (deltaMs: number) => void, running: boolean) {
  const tickRef = useRef(tick);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number | null>(null);

  // Keep tick ref fresh without restarting the loop
  tickRef.current = tick;

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
      return;
    }

    const frame = (ts: number) => {
      if (lastRef.current === null) lastRef.current = ts;
      const delta = Math.min(ts - lastRef.current, 100); // cap at 100ms
      lastRef.current = ts;
      tickRef.current(delta);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    };
  }, [running]);
}
