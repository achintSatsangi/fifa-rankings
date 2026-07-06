import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BracketMatch } from "../../data/types";
import { formatCountdown, formatKickoff } from "./matchTime";

type Props = {
  match: BracketMatch;
  className?: string;
};

/**
 * Small floating tooltip with the match's kickoff, countdown and
 * venue. Positioned absolutely below its `group` parent — caller
 * controls visibility via `group-hover:opacity-100`.
 */
export function MatchTooltip({ match, className = "" }: Props) {
  const { t } = useTranslation();
  const countdown = useCountdown(match.utcDate);

  return (
    <div
      role="tooltip"
      className={
        "pointer-events-none absolute left-1/2 top-full z-40 mt-2 " +
        "-translate-x-1/2 whitespace-nowrap rounded-md px-3 py-2 text-xs " +
        "opacity-0 shadow-md transition-opacity duration-150 " +
        "group-hover:opacity-100 group-focus-visible:opacity-100 " +
        className
      }
      style={{ background: "var(--tooltip-bg)", color: "var(--tooltip-text)" }}
    >
      <div className="font-semibold">{formatKickoff(match)}</div>
      {countdown ? (
        <div className="mt-0.5 opacity-80">
          {t("matches.startsIn")} {countdown}
        </div>
      ) : null}
      <div className="mt-0.5 opacity-80">{match.venue}</div>
    </div>
  );
}

/** Recomputes the countdown every 30s so a hovered tooltip stays fresh. */
function useCountdown(utcDate: string | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!utcDate) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [utcDate]);
  if (!utcDate) return null;
  return formatCountdown(utcDate, now);
}
