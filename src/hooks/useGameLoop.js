import { useEffect, useRef } from 'react';

/**
 * Runs a requestAnimationFrame loop, calling `callback(deltaTime, timestamp)` each frame.
 * Stops when `active` is false.
 *
 * @param {Function} callback - (deltaMs: number, timestamp: number) => void
 * @param {boolean} active
 */
export function useGameLoop(callback, active) {
  const callbackRef = useRef(callback);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Always use latest callback without restarting loop
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (timestamp) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = Math.min(timestamp - lastTimeRef.current, 50); // cap at 50ms
      lastTimeRef.current = timestamp;
      callbackRef.current(delta, timestamp);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);
}
