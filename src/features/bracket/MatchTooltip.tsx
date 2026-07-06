import { useTranslation } from "react-i18next";
import type { BracketMatch } from "../../data/types";
import { useSecondTicker } from "../../lib/ticker";
import { teamByCode } from "../teams/data";
import { formatCountdown, formatKickoff, formatScore, isMatchPlayed } from "./matchTime";

type Props = {
  match: BracketMatch;
  visible: boolean;
  /** When provided, the score line renders from this team's perspective
   *  and includes team names on either side. Radial passes the flag's
   *  team here; horizontal leaves it unset (the card already shows both
   *  team names + score, so we only add date + venue). */
  focusTeam?: string;
  className?: string;
};

/**
 * Floating tooltip with kickoff, live countdown (upcoming) or a
 * result line (played), and venue. Positioned absolutely below its
 * parent, visibility is controlled by the caller.
 */
export function MatchTooltip({ match, visible, focusTeam, className = "" }: Props) {
  const { t } = useTranslation();
  const played = isMatchPlayed(match);

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
      {played ? (
        focusTeam ? <ResultLine match={match} focusTeam={focusTeam} /> : null
      ) : (
        <CountdownLine match={match} label={t("matches.startsIn")} />
      )}
      <div className="mt-0.5 opacity-80">{match.venue}</div>
    </div>
  );
}

function ResultLine({ match, focusTeam }: { match: BracketMatch; focusTeam: string }) {
  const focusIsA = match.teamCodeA === focusTeam;
  const leftCode = focusIsA ? match.teamCodeA : match.teamCodeB;
  const rightCode = focusIsA ? match.teamCodeB : match.teamCodeA;
  const leftName = teamByCode(leftCode)?.name ?? leftCode ?? "?";
  const rightName = teamByCode(rightCode)?.name ?? rightCode ?? "?";
  return (
    <div className="mt-0.5">
      <span className="font-medium">{leftName}</span>{" "}
      <span className="font-mono tabular-nums">{formatScore(match, focusTeam)}</span>{" "}
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
