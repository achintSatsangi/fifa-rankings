import { useTranslation } from "react-i18next";
import { BUILD_TIMESTAMP, formatAbsolute } from "../lib/buildInfo";
import { minutesSince, minutesUntil, nextRefreshAt } from "../lib/refreshSchedule";
import { useSecondTicker } from "../lib/ticker";

/**
 * Small pill in the header showing when data was last refreshed and
 * when the next scheduled refresh will fire. Hidden entirely when
 * BUILD_TIMESTAMP is missing (local dev without VITE_BUILD_TIMESTAMP).
 */
export function DataFreshnessChip() {
  const { t } = useTranslation();
  const now = useSecondTicker();

  if (!BUILD_TIMESTAMP) return null;

  const ago = minutesSince(BUILD_TIMESTAMP, now);
  const next = nextRefreshAt(new Date(now));
  const untilNext = minutesUntil(next, now);

  const agoLabel = ago === 0 ? t("meta.justNow") : t("meta.minutesAgo", { count: ago });
  const nextLabel = untilNext === 0 ? t("meta.dueNow") : t("meta.nextInMinutes", { count: untilNext });

  const title = `${t("meta.dataUpdated")} ${formatAbsolute(BUILD_TIMESTAMP)}
${t("meta.nextRefresh")} ${formatAbsolute(next.toISOString())}`;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)]/60 px-2.5 py-1 text-[11px] leading-none text-[var(--text-secondary)] sm:text-xs"
      title={title}
      aria-label={title}
    >
      <RefreshIcon />
      <span>{agoLabel}</span>
      <span aria-hidden="true" className="hidden opacity-50 sm:inline">·</span>
      <span className="hidden sm:inline">{nextLabel}</span>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3.51-7.13" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  );
}
