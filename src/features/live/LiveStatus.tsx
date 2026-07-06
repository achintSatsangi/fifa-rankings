import { footballDataEnabled } from "./config";
import { FootballDataError } from "./client";
import { useCompetition } from "./hooks";

const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

/**
 * Sidebar indicator for the football-data.org connection. Renders a
 * subtle status line — hidden entirely if no key is configured so the
 * app stays clean when running fully offline.
 */
export function LiveStatus() {
  const { data, isLoading, isError, error } = useCompetition();

  if (!footballDataEnabled) {
    return <StatusDot color="var(--text-muted)" label="Live · off (no API key)" />;
  }
  if (isLoading) {
    return <StatusDot color="var(--text-muted)" label="Live · connecting…" />;
  }
  if (isError) {
    const msg =
      error instanceof FootballDataError && error.status === 429
        ? `Live · rate-limited (${error.retryAfterSeconds ?? 60}s)`
        : "Live · error";
    return <StatusDot color="var(--error)" label={msg} />;
  }
  if (!data) return null;

  const season = data.currentSeason;
  const window = `${dateFmt.format(new Date(season.startDate))} – ${dateFmt.format(new Date(season.endDate))}`;
  return (
    <StatusDot
      color="var(--success)"
      label={`Live · ${data.name} · MD ${season.currentMatchday ?? "—"} (${window})`}
    />
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
