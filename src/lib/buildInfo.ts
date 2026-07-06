/**
 * Build-time metadata baked in by Vite. In CI the workflow sets
 * `VITE_BUILD_TIMESTAMP` to `github.run_started_at`, which lands
 * within seconds of the football-data.org refresh — so it's a fair
 * proxy for "data last fetched". Locally it's usually blank.
 */

const RAW = (import.meta.env.VITE_BUILD_TIMESTAMP as string | undefined)?.trim() ?? "";

export const BUILD_TIMESTAMP: string | null = RAW.length > 0 ? RAW : null;

export function formatRelative(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86_400), "day");
}

const iso = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatAbsolute(iso_: string): string {
  return iso.format(new Date(iso_));
}
