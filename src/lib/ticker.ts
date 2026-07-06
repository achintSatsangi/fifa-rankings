import { useEffect, useState } from "react";

/**
 * Shared 1-second ticker. Every component that calls `useSecondTicker`
 * subscribes to the same `setInterval` so we're not spinning up N
 * timers when there are N match tooltips mounted.
 */

const listeners = new Set<(now: number) => void>();
let intervalId: number | null = null;

function tick(): void {
  const now = Date.now();
  for (const listener of listeners) listener(now);
}

function ensureRunning(): void {
  if (intervalId !== null) return;
  intervalId = window.setInterval(tick, 1000);
}

function ensureStopped(): void {
  if (intervalId === null || listeners.size > 0) return;
  window.clearInterval(intervalId);
  intervalId = null;
}

export function useSecondTicker(): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    listeners.add(setNow);
    ensureRunning();
    return () => {
      listeners.delete(setNow);
      ensureStopped();
    };
  }, []);
  return now;
}
