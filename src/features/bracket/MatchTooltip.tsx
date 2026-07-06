import { useTranslation } from "react-i18next";
import type { BracketMatch } from "../../data/types";
import { useSecondTicker } from "../../lib/ticker";
import { formatCountdown, formatKickoff } from "./matchTime";

type Props = {
  match: BracketMatch;
  /** Controlled visibility. Callers use `useHoverTapToggle` (hover on
   *  desktop, tap on mobile) to drive this. */
  visible: boolean;
  className?: string;
};

/**
 * Floating tooltip with kickoff, live countdown, and venue. Positioned
 * absolutely below its parent. When invisible it disables pointer
 * events so it doesn't intercept taps on the card underneath; when
 * visible it captures clicks and stops propagation so tapping the
 * tooltip itself doesn't dismiss it via a bubbling outside-click.
 */
export function MatchTooltip({ match, visible, className = "" }: Props) {
  const { t } = useTranslation();
  const now = useSecondTicker();
  const countdown = match.utcDate ? formatCountdown(match.utcDate, now) : null;

  return (
    <div
      role="tooltip"
      className={
        "absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 whitespace-nowrap " +
        "rounded-md px-3 py-2 text-xs shadow-md transition-opacity duration-150 " +
        (visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0") +
        " " +
        className
      }
      style={{ background: "var(--tooltip-bg)", color: "var(--tooltip-text)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-semibold">{formatKickoff(match)}</div>
      {countdown ? (
        <div className="mt-0.5 font-mono tabular-nums opacity-90">
          {t("matches.startsIn")} {countdown}
        </div>
      ) : null}
      <div className="mt-0.5 opacity-80">{match.venue}</div>
    </div>
  );
}
