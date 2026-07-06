/**
 * Mirrors the CI cron in .github/workflows/refresh-and-deploy.yml
 * (`2,32 * * * *`) so the client can display when the next refresh
 * should fire. The workflow runs in UTC, but each slot is the same
 * wall-clock minute in every timezone, so a local Date works fine.
 */
const REFRESH_MINUTES = [2, 32];

export function nextRefreshAt(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setSeconds(0, 0);
  const minute = now.getMinutes();
  const nextSlot = REFRESH_MINUTES.find((m) => m > minute);
  if (nextSlot !== undefined) {
    next.setMinutes(nextSlot);
  } else {
    next.setMinutes(REFRESH_MINUTES[0]);
    next.setHours(next.getHours() + 1);
  }
  return next;
}

export function minutesUntil(target: Date, nowMs: number = Date.now()): number {
  return Math.max(0, Math.round((target.getTime() - nowMs) / 60_000));
}

export function minutesSince(iso: string, nowMs: number = Date.now()): number {
  return Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / 60_000));
}
