import type { BracketMatch, GroupMatch } from "../../data/types";

/**
 * Locale-aware formatters — `undefined` locale means "use the browser's
 * default", which gives users their own conventions (e.g. 24h clock in
 * most of Europe, MM/DD ordering in the US).
 *
 * Date-only formatters explicitly set `timeZone: "UTC"` so the venue's
 * calendar date renders unchanged. `new Date("2026-06-11")` parses as
 * UTC midnight, and without `timeZone: "UTC"` a user in California
 * would see "Jun 10" (the previous day in their local zone).
 */

const kickoffFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const dateFullFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dateShortFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Kickoff in the user's local timezone. Falls back to the calendar
 *  date when there's no `utcDate`. */
export function formatKickoff(match: Pick<BracketMatch, "date" | "utcDate">): string {
  if (match.utcDate) return kickoffFmt.format(new Date(match.utcDate));
  return dateFullFmt.format(new Date(match.date));
}

/** Compact calendar-date string like "Jul 10" for cards + table cells. */
export function formatMatchDate(dateStr: string): string {
  return dateShortFmt.format(new Date(dateStr));
}

/** Long calendar-date string like "Sat, Jul 10" (adds weekday). */
export function formatMatchDateLong(dateStr: string): string {
  return dateFullFmt.format(new Date(dateStr));
}

export function isMatchPlayed(
  match: Pick<BracketMatch, "scoreA" | "scoreB"> | Pick<GroupMatch, "homeScore" | "awayScore">,
): boolean {
  if ("scoreA" in match) return match.scoreA !== null && match.scoreB !== null;
  return match.homeScore !== null && match.awayScore !== null;
}

/**
 * Days / hours / minutes / seconds until kickoff. Returns null if the
 * match is already past, or if the timestamp isn't parseable. Meant to
 * be recomputed once per second by callers so the value ticks live.
 */
export function formatCountdown(iso: string, now: number = Date.now()): string | null {
  const target = new Date(iso).getTime();
  if (!Number.isFinite(target)) return null;
  const diffMs = target - now;
  if (diffMs <= 0) return null;

  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(":");
}
