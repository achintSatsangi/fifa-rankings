import { useTranslation } from "react-i18next";
import type { BracketMatch } from "../../data/types";
import { useSecondTicker } from "../../lib/ticker";
import { teamByCode } from "../teams/data";
import { formatCountdown, formatKickoff, formatScore, isMatchPlayed } from "./matchTime";

type Props = {
  match: BracketMatch;
  visible: boolean;
  /** When provided, the middle line shows this team's name first with
   *  either the score (played) or "vs opponent" (upcoming). */
  focusTeam?: string;
  /** Which side of the anchor to render the tooltip on. Defaults to
   *  "below". For flags on the top half of a radial, callers should
   *  pass "above" so the tooltip goes outward (away from the crowded
   *  ring interior) instead of covering nearby flags. */
  placement?: "above" | "below";
  className?: string;
};

/**
 * Floating tooltip. Contents depend on the match state:
 *   played  + focusTeam → date, team-perspective result, venue
 *   played  + no focus  → date, venue
 *   upcoming + focusTeam → date, "focus vs opponent", live countdown, venue
 *   upcoming + no focus  → date, live countdown, venue
 */
export function MatchTooltip({ match, visible, focusTeam, placement = "below", className = "" }: Props) {
  const { t } = useTranslation();
  const played = isMatchPlayed(match);
  const placementClasses =
    placement === "above" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div
      role="tooltip"
      className={
        `absolute left-1/2 ${placementClasses} z-40 -translate-x-1/2 whitespace-nowrap ` +
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
      {focusTeam ? <MatchupLine match={match} focusTeam={focusTeam} /> : null}
      {!played ? <CountdownLine match={match} label={t("matches.startsIn")} /> : null}
      <div className="mt-0.5 opacity-80">{match.venue}</div>
    </div>
  );
}

function MatchupLine({ match, focusTeam }: { match: BracketMatch; focusTeam: string }) {
  const focusIsA = match.teamCodeA === focusTeam;
  const leftCode = focusIsA ? match.teamCodeA : match.teamCodeB;
  const rightCode = focusIsA ? match.teamCodeB : match.teamCodeA;
  const leftName = teamByCode(leftCode)?.name ?? leftCode ?? "?";
  const rightName = teamByCode(rightCode)?.name ?? rightCode ?? "?";
  const played = isMatchPlayed(match);
  return (
    <div className="mt-0.5">
      <span className="font-medium">{leftName}</span>{" "}
      {played ? (
        <span className="font-mono tabular-nums">{formatScore(match, focusTeam)}</span>
      ) : (
        <span className="opacity-80">vs</span>
      )}{" "}
      <span className="font-medium">{rightName}</span>
    </div>
  );
}

function CountdownLine({ match, label }: { match: BracketMatch; label: string }) {
  const now = useSecondTicker();
  if (!match.utcDate) return null;
  const cd = formatCountdown(match.utcDate, now);
  if (!cd) return null;
  return (
    <div className="mt-0.5 font-mono tabular-nums opacity-90">
      {label} {cd}
    </div>
  );
}
