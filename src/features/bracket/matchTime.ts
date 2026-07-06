import type { BracketMatch } from "../../data/types";

/**
 * Locale-aware formatters — `undefined` locale means "use the browser's
 * best guess", which is what we want so users see their own conventions
 * (e.g. 24h in most of Europe, 12h in the US).
 */

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const dateOnlyFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * Preferred kickoff string in the user's local timezone. Falls back to
 * a date-only string if the match only carries `date` (no `utcDate`).
 */
export function formatKickoff(match: Pick<BracketMatch, "date" | "utcDate">): string {
  if (match.utcDate) return dateTimeFmt.format(new Date(match.utcDate));
  return dateOnlyFmt.format(new Date(`${match.date}T00:00:00Z`));
}

export function isMatchPlayed(match: Pick<BracketMatch, "scoreA" | "scoreB">): boolean {
  return match.scoreA !== null && match.scoreB !== null;
}
