import type { BracketMatch } from "../../data/types";
import { formatKickoff } from "./matchTime";

type Props = {
  match: BracketMatch;
  className?: string;
};

/**
 * Small floating tooltip with the match's kickoff and venue. Positioned
 * absolutely below its `group` parent — caller controls visibility via
 * `group-hover:opacity-100`.
 */
export function MatchTooltip({ match, className = "" }: Props) {
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
      <div className="mt-0.5 opacity-80">{match.venue}</div>
    </div>
  );
}
